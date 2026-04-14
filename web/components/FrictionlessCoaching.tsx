'use client'

import { motion } from 'framer-motion'
import { HiCheckCircle, HiBolt, HiCircleStack, HiMicrophone, HiPhone } from 'react-icons/hi2'
import Image from 'next/image'

const FrictionlessCoaching = () => {
    return (
        <section id="integrations" className="section-padding bg-navy border-t border-teal/10">
            <div className="container-custom">
                {/* One-Click Coaching Demo Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-teal">One-Click</span> Coaching in Action
                    </h2>
                    <p className="text-xl text-light-muted max-w-3xl mx-auto mb-12">
                        Paste a transcript. Click analyze. Get instant, methodology-specific coaching with proven scripts.
                    </p>

                    {/* Animated One-Click Coaching Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative max-w-4xl mx-auto"
                    >
                        <motion.div
                            animate={{
                                boxShadow: [
                                    '0 0 30px rgba(20, 184, 166, 0.2)',
                                    '0 0 60px rgba(20, 184, 166, 0.4)',
                                    '0 0 30px rgba(20, 184, 166, 0.2)'
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="rounded-2xl overflow-hidden border border-teal/30"
                        >
                            <Image
                                src="/images/one-click-coaching.jpg"
                alt="One-Click AI Sales Coaching Dashboard: Paste call transcript, click analyze, receive instant MEDDIC Sandler methodology coaching with proven scripts in 60 seconds"
                                width={900}
                                height={600}
                                className="w-full h-auto"
                            />
                        </motion.div>

                        {/* Animated callouts */}
                        <motion.div
                            animate={{ y: [0, -10, 0], opacity: [0.9, 1, 0.9] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-4 left-1/4 bg-gold text-navy px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                        >
                            Step 1: Paste
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, -10, 0], opacity: [0.9, 1, 0.9] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                            className="absolute top-1/3 -right-2 md:right-4 bg-teal text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                        >
                            Step 2: Click
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, -10, 0], opacity: [0.9, 1, 0.9] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                            className="absolute -bottom-4 right-1/4 bg-aqua text-navy px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                        >
                            Step 3: Coach!
                        </motion.div>
                    </motion.div>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column: Copy */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Frictionless Coaching Through{' '}
                            <span className="text-teal text-glow-teal">Native Integrations</span>
                        </h2>
                        <p className="text-xl text-light-muted mb-8 leading-relaxed font-semibold">
                            Coaching only works when it fits the rep’s real workflow.
                        </p>
                        <p className="text-lg text-light-muted mb-12 leading-relaxed text-gray-300">
                            That’s why <span className="text-teal font-bold">One Click Coaching</span> integrates directly with the tools your team already uses — so coaching happens automatically, not manually.
                        </p>

                        <div className="space-y-8 mb-12">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20">
                                    <HiCircleStack className="text-orange-500 text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">HubSpot</h3>
                                    <p className="text-light-muted text-sm italic">CRM activity, deal context, and rep behavior</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                    <HiMicrophone className="text-blue-500 text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Fathom</h3>
                                    <p className="text-light-muted text-sm italic">Online meeting recordings and transcripts</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                                    <HiPhone className="text-green-500 text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-1">Aircall</h3>
                                    <p className="text-light-muted text-sm italic">Phone conversations and call data</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-lg font-bold text-teal flex items-center gap-2 mb-4">
                            <HiBolt className="text-gold" /> Sales activity flows in automatically — without changing how reps work.
                        </p>
                    </motion.div>

                    {/* Right Column: Benefits/Result Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="card relative overflow-hidden bg-gradient-to-br from-navy-light to-navy border-teal/20"
                    >
                        {/* Background Accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full blur-3xl -mr-16 -mt-16" />

                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                            🚀 <span className="bg-gradient-to-r from-teal to-aqua bg-clip-text text-transparent">What This Means for Sales Leaders</span>
                        </h3>

                        <div className="space-y-4 mb-10">
                            {[
                                "Reps don’t need to remember to upload anything",
                                "Managers don’t chase recordings",
                                "Coaching is based on real conversations, not summaries",
                                "Feedback happens while behavior is still fresh"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 bg-navy/40 p-3 rounded-lg border border-teal/5">
                                    <HiCheckCircle className="text-teal mt-1 flex-shrink-0" />
                                    <span className="text-light-muted text-sm font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-pink/5 border border-pink/10 rounded-xl p-6 mb-8">
                            <h4 className="text-sm font-bold text-pink uppercase tracking-wider mb-4">This eliminates:</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {["Rep self-reporting", "Pipeline storytelling", "Delayed coaching", "Vague feedback"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-light-muted/80">
                                        <span className="text-pink">✕</span> {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <blockquote className="border-l-4 border-gold pl-6 py-2 italic text-light-muted mb-8 text-sm">
                            "When the system does the work, the coach can focus on judgment — not administration."
                        </blockquote>

                        <a
                            href="https://tidycal.com/aiautomations/sales-coach"
                            className="btn-primary block text-center py-4 text-lg font-bold shadow-glow-teal transition-transform hover:scale-[1.02]"
                        >
                            Book a 15-Minute Execution Review
                        </a>
                    </motion.div>
                </div>

                {/* Why This Matters Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-24 max-w-4xl mx-auto rounded-2xl bg-navy-light/50 border border-teal/10 p-10 text-center"
                >
                    <h3 className="text-2xl font-bold mb-6 italic text-gray-200">
                        "Methodology behavior breaks down <span className="text-pink underline underline-offset-4">under pressure</span>, not in training rooms."
                    </h3>
                    <div className="grid md:grid-cols-2 gap-10 text-left mt-10">
                        <div className="space-y-4">
                            <h4 className="text-teal font-bold uppercase tracking-wider text-sm">The Broken Reality:</h4>
                            <ul className="space-y-3">
                                <li className="text-light-muted text-sm flex items-center gap-2">
                                    <span className="text-pink">➔</span> Requires extra steps
                                </li>
                                <li className="text-light-muted text-sm flex items-center gap-2">
                                    <span className="text-pink">➔</span> Happens days later
                                </li>
                                <li className="text-light-muted text-sm flex items-center gap-2">
                                    <span className="text-pink">➔</span> Depends on memory
                                </li>
                            </ul>
                            <p className="text-xs text-pink font-bold mt-4 uppercase">Result: Habits don't change.</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-gold font-bold uppercase tracking-wider text-sm">The One Click Advantage:</h4>
                            <p className="text-light-muted leading-relaxed">
                                <span className="text-white font-bold">Frictionless data flow enables immediate reinforcement.</span>
                            </p>
                            <p className="text-light-muted leading-relaxed mt-2 text-sm italic border-t border-teal/10 pt-4">
                                Immediate reinforcement is how habits are formed and revenue leaking habits are permanentely untangled.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default FrictionlessCoaching
