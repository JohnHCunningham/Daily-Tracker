'use client'

import { motion } from 'framer-motion'
import { HiCheckCircle, HiBolt, HiCircleStack, HiMicrophone, HiPhone } from 'react-icons/hi2'

const SandlerFrictionlessCoaching = () => {
    return (
        <section id="integrations" className="section-padding bg-navy border-t border-teal/10">
            <div className="container-custom">
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
                        <h3 className="text-xl text-light mb-8 leading-relaxed font-semibold border-b border-teal/10 pb-4">
                            Coaching only works when it fits the rep’s real workflow.
                        </h3>
                        <p className="text-lg text-light-muted mb-12 leading-relaxed">
                            That’s why <span className="text-teal font-bold uppercase tracking-wider">One Click Coaching</span> integrates directly with the tools your team already uses — so **Sandler coaching** happens automatically, not manually.
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

                        <p className="text-lg font-bold text-teal flex items-center gap-2 mb-4 bg-teal/5 p-4 rounded-lg border border-teal/10">
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
                            🚀 <span className="bg-gradient-to-r from-teal to-aqua bg-clip-text text-transparent uppercase tracking-tight">What This Means for Sales Leaders</span>
                        </h3>

                        <div className="space-y-4 mb-10">
                            {[
                                "Reps don’t need to remember to upload anything",
                                "Managers don’t chase recordings",
                                "Coaching is based on real conversations, not summaries",
                                "Feedback happens while behavior is still fresh"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 bg-navy/40 p-4 rounded-lg border border-teal/5">
                                    <HiCheckCircle className="text-teal mt-1 flex-shrink-0" />
                                    <span className="text-light-muted text-sm font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-pink/5 border border-pink/10 rounded-xl p-6 mb-8">
                            <h4 className="text-xs font-bold text-pink uppercase tracking-widest mb-4">This eliminates:</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {["Rep self-reporting", "Pipeline storytelling", "Delayed coaching", "“I’ll fix it next time”"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px] text-light-muted/80">
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

                {/* Why This Matters Section (Sandler Reality) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-24 max-w-4xl mx-auto rounded-3xl bg-navy-light/40 border border-teal/10 p-12 text-center shadow-2xl"
                >
                    <h3 className="text-3xl font-bold mb-8 text-gray-100">
                        Why This Matters (<span className="text-pink italic">Sandler Reality</span>)
                    </h3>
                    <p className="text-xl text-light-muted mb-10 leading-relaxed max-w-2xl mx-auto">
                        Sandler behavior breaks down <span className="text-white font-bold">under pressure</span>, not in training rooms.
                    </p>
                    <div className="grid md:grid-cols-2 gap-12 text-left">
                        <div className="space-y-6">
                            <h4 className="text-pink font-bold uppercase tracking-widest text-sm border-b border-pink/10 pb-2">Ineffective Coaching If:</h4>
                            <ul className="space-y-4">
                                <li className="text-light-muted text-sm flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-pink"></span> Requires extra steps
                                </li>
                                <li className="text-light-muted text-sm flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-pink"></span> Happens days later
                                </li>
                                <li className="text-light-muted text-sm flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-pink"></span> Depends on memory
                                </li>
                            </ul>
                            <p className="text-sm text-pink font-black mt-6 tracking-tight">HABITS LOSE THE BATTLE.</p>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-teal font-bold uppercase tracking-widest text-sm border-b border-teal/10 pb-2">The One Click Advantage:</h4>
                            <p className="text-light leading-relaxed font-bold">
                                Frictionless data flow enables immediate reinforcement.
                            </p>
                            <p className="text-light-muted leading-relaxed text-sm italic">
                                Immediate reinforcement is how **Sandler habits** are formed and revenue-leaking habits are permanently untangled.
                            </p>
                            <p className="text-sm text-teal font-black mt-6 tracking-tight uppercase">Habits win for life.</p>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-teal/10 flex flex-col items-center">
                        <p className="text-light-muted mb-6 text-sm">One Click Coaching doesn’t ask reps to work differently.</p>
                        <div className="text-2xl font-bold text-light">It simply makes <span className="text-gold italic underline underline-offset-4">their existing work coachable.</span></div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default SandlerFrictionlessCoaching
