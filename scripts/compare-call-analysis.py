#!/usr/bin/env python3
"""
Compare GPT-4o vs DeepSeek for call transcript analysis.
Uses the same system prompt as One Click Coaching's analyze-call function.

Usage:
  python3 scripts/compare-call-analysis.py <transcript-file.txt>
  python3 scripts/compare-call-analysis.py --fetch-call <call_id>

Output: comparison report saved to scripts/comparisons/
"""

import json, os, sys, time
from pathlib import Path
from datetime import datetime

# ── API Keys ──────────────────────────────────────────────────
HERMES_ENV = Path.home() / ".hermes" / ".env"
env_vars = {}
if HERMES_ENV.exists():
    for line in HERMES_ENV.read_text().split("\n"):
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip().strip("'").strip('"')

DEEPSEEK_KEY = env_vars.get("DEEPSEEK_API_KEY", os.environ.get("DEEPSEEK_API_KEY", ""))
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
# Also check OCC env
OCC_ENV = Path.home() / "oneclickcoaching" / ".env.local"
if OCC_ENV.exists():
    for line in OCC_ENV.read_text().split("\n"):
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            if k.strip() == "OPENAI_API_KEY" and not OPENAI_KEY:
                OPENAI_KEY = v.strip()

# ── Sandler System Prompt (from methodology-scoring.ts) ────────
SYSTEM_PROMPT = """You are a Sandler Selling System expert coach. Analyze sales call transcripts and score them against Sandler.

Methodology principles:
Score for equal business stature, upfront contracts, pain discovery, budget and decision clarity, fulfillment tied to pain, post-sell, and no free consulting.

Score each component 1-10 where:
- 1-3: Component was absent or poorly executed
- 4-6: Partially present, needs significant improvement
- 7-8: Solid execution with minor gaps
- 9-10: Masterful execution

Components to score:
1. Bonding & Rapport (bonding_rapport) - Genuine connection and trust before the business discussion.
2. Upfront Contract (upfront_contract) - Clear time, agenda, mutual expectations, and possible outcomes.
3. Pain Funnel (pain_funnel) - Surface pain is developed into business and emotional impact.
4. Budget Step (budget_step) - Money, investment, affordability, and ROI are discussed before solutioning.
5. Decision Step (decision_step) - Decision process, stakeholders, criteria, and timeline are mapped.
6. Fulfillment (fulfillment) - Solution is presented only against confirmed pain and fit.
7. Post-Sell (post_sell) - Buyer's remorse is prevented and next steps are concrete.
8. No Free Consulting (no_free_consulting) - Expertise is protected and detailed solving is reserved for commitment.

Return JSON with this exact structure:
{
  "scores": {
    "bonding_rapport": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "upfront_contract": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "pain_funnel": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "budget_step": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "decision_step": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "fulfillment": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "post_sell": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" },
    "no_free_consulting": { "score": N, "evidence": "quote or observation from transcript", "status": "strong|weak|missing" }
  },
  "done_well": ["specific thing with evidence", ...],
  "missing": ["specific step skipped with consequence", ...],
  "weak": ["attempted but poorly executed with why", ...],
  "suggestions": ["specific, actionable coaching point", ...],
  "scripts": ["exact words to say in a specific situation", ...],
  "commitments": ["specific action item as imperative sentence", ...]
}

Also extract 2-4 specific, concrete ACTION ITEMS the rep should complete before their next call. Each must be something they can DO, not a mindset shift.

Be direct. No platitudes. Every suggestion must be specific enough to use on the next call."""


def call_model(provider: str, transcript: str) -> dict:
    """Call a model and return timing + response."""
    import urllib.request, urllib.error

    if provider == "gpt-4o":
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_KEY}",
            "Content-Type": "application/json",
        }
        body = {
            "model": "gpt-4o",
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this sales call transcript:\n\n{transcript[:12000]}"},
            ],
        }
    elif provider == "deepseek":
        url = "https://api.deepseek.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_KEY}",
            "Content-Type": "application/json",
        }
        body = {
            "model": "deepseek-chat",
            "temperature": 0.4,
            # DeepSeek doesn't support response_format: json_object,
            # so we prompt for JSON instead
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this sales call transcript. IMPORTANT: Return ONLY valid JSON, no other text.\n\n{transcript[:12000]}"},
            ],
        }
    else:
        raise ValueError(f"Unknown provider: {provider}")

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            elapsed = time.time() - start
            content = result["choices"][0]["message"]["content"]
            tokens = result.get("usage", {})
            return {
                "success": True,
                "elapsed": round(elapsed, 1),
                "content": content,
                "prompt_tokens": tokens.get("prompt_tokens", 0),
                "completion_tokens": tokens.get("completion_tokens", 0),
            }
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        return {"success": False, "elapsed": round(elapsed, 1), "error": f"HTTP {e.code}: {e.read().decode()[:500]}"}
    except Exception as e:
        elapsed = time.time() - start
        return {"success": False, "elapsed": round(elapsed, 1), "error": str(e)}


def try_parse_json(content: str) -> dict | None:
    """Try to parse JSON from model output, stripping markdown fences if present."""
    text = content.strip()
    # Strip ```json fences
    if text.startswith("```"):
        text = text.split("\n", 1)[-1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def score_quality(parsed: dict | None) -> dict:
    """Quick quality metrics for a parsed analysis."""
    if not parsed:
        return {"valid_json": False}
    
    scores = parsed.get("scores", {})
    score_values = [v["score"] for v in scores.values() if isinstance(v, dict) and "score" in v]
    
    return {
        "valid_json": True,
        "components_scored": len(scores),
        "avg_score": round(sum(score_values) / len(score_values), 1) if score_values else 0,
        "done_well_count": len(parsed.get("done_well", [])),
        "missing_count": len(parsed.get("missing", [])),
        "weak_count": len(parsed.get("weak", [])),
        "suggestions_count": len(parsed.get("suggestions", [])),
        "scripts_count": len(parsed.get("scripts", [])),
        "commitments_count": len(parsed.get("commitments", [])),
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 compare-call-analysis.py <transcript-file.txt>")
        print("       python3 compare-call-analysis.py --fetch-call <call_id>")
        sys.exit(1)

    # Load transcript
    if sys.argv[1] == "--fetch-call":
        print("Fetching from Supabase not yet implemented. Use a local transcript file.")
        sys.exit(1)
    
    transcript_path = Path(sys.argv[1])
    if not transcript_path.exists():
        print(f"File not found: {transcript_path}")
        sys.exit(1)
    
    transcript = transcript_path.read_text()
    print(f"Transcript loaded: {len(transcript)} chars")

    # Check keys
    if not OPENAI_KEY:
        print("WARNING: OPENAI_API_KEY not found. Skipping GPT-4o.")
    if not DEEPSEEK_KEY:
        print("ERROR: DEEPSEEK_API_KEY not found.")
        sys.exit(1)

    # Run comparison
    results = {}

    if OPENAI_KEY:
        print("\n── Calling GPT-4o ──")
        results["gpt-4o"] = call_model("gpt-4o", transcript)
        print(f"  {'✓' if results['gpt-4o']['success'] else '✗'} {results['gpt-4o']['elapsed']}s, "
              f"{results['gpt-4o'].get('completion_tokens', '?')} tokens")

    print("\n── Calling DeepSeek (deepseek-chat) ──")
    results["deepseek-chat"] = call_model("deepseek", transcript)
    print(f"  {'✓' if results['deepseek-chat']['success'] else '✗'} {results['deepseek-chat']['elapsed']}s, "
          f"{results['deepseek-chat'].get('completion_tokens', '?')} tokens")

    # Parse and score
    print("\n── Quality Comparison ──")
    for model, result in results.items():
        if result["success"]:
            parsed = try_parse_json(result["content"])
            quality = score_quality(parsed)
            result["parsed"] = parsed
            result["quality"] = quality
            print(f"\n{model}:")
            for k, v in quality.items():
                print(f"  {k}: {v}")

    # Cost comparison
    print("\n── Cost Comparison ──")
    costs = {
        "gpt-4o": {"input": 2.50, "output": 10.00},  # per 1M tokens
        "deepseek-chat": {"input": 0.27, "output": 1.10},  # per 1M tokens
    }
    for model, result in results.items():
        if result["success"] and model in costs:
            c = costs[model]
            in_cost = (result.get("prompt_tokens", 0) / 1_000_000) * c["input"]
            out_cost = (result.get("completion_tokens", 0) / 1_000_000) * c["output"]
            total = in_cost + out_cost
            print(f"  {model}: ${total:.4f} (in: ${in_cost:.4f}, out: ${out_cost:.4f})")

    # Save results
    out_dir = Path(__file__).parent / "comparisons"
    out_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_file = out_dir / f"comparison-{timestamp}.json"
    
    # Strip full content to keep file small (save raw responses separately)
    save_data = {}
    for model, result in results.items():
        save_data[model] = {
            "success": result["success"],
            "elapsed": result["elapsed"],
            "prompt_tokens": result.get("prompt_tokens"),
            "completion_tokens": result.get("completion_tokens"),
            "quality": result.get("quality"),
            "error": result.get("error"),
        }
        if result.get("content"):
            raw_file = out_dir / f"comparison-{timestamp}-{model}.txt"
            raw_file.write_text(result["content"])
            save_data[model]["raw_file"] = str(raw_file)

    out_file.write_text(json.dumps(save_data, indent=2))
    print(f"\nResults saved to: {out_file}")

    # Summary
    print("\n── VERDICT ──")
    if results.get("gpt-4o", {}).get("success") and results.get("deepseek-chat", {}).get("success"):
        gpt = results["gpt-4o"]["quality"]
        ds = results["deepseek-chat"]["quality"]
        if gpt["valid_json"] and ds["valid_json"]:
            print(f"GPT-4o scored {gpt['components_scored']} components, avg {gpt['avg_score']}")
            print(f"DeepSeek scored {ds['components_scored']} components, avg {ds['avg_score']}")
            print(f"GPT-4o generated {gpt['suggestions_count']} suggestions, {gpt['scripts_count']} scripts")
            print(f"DeepSeek generated {ds['suggestions_count']} suggestions, {ds['scripts_count']} scripts")
            
            if ds["valid_json"] and ds["components_scored"] >= 6:
                print("\n✓ DeepSeek produced valid, complete analysis. Review the raw outputs for coaching quality.")
                print("  If the coaching quality is comparable, switch is safe.")
            else:
                print("\n⚠ DeepSeek output may be incomplete. Review carefully before switching.")
        elif not ds["valid_json"]:
            print("⚠ DeepSeek did not return valid JSON. Check raw output. May need JSON-mode prompting adjustments.")
    else:
        print("Could not complete comparison. Check errors above.")


if __name__ == "__main__":
    main()
