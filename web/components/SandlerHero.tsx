'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { HiPlay, HiXMark } from 'react-icons/hi2'

const emailSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

type EmailForm = z.infer<typeof emailSchema>

const SandlerHero = () => {
    const [showVideo, setShowVideo] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EmailForm>({
        resolver: zodResolver(emailSchema),
    })

    const onSubmit = async (data: EmailForm) => {
        try {
            toast.success('🎉 Redirecting to book your Sandler ROI review...')
            setTimeout(() => {
                window.location.href = 'https://tidycal.com/aiautomations/sales-coach'
            }, 800)
        } catch (error) {
            toast.error('Something went wrong. Please try again.')
        }
    }

    return (
        <section className="relative overflow-hidden bg-gradient-navy section-padding pt-32 pb-20">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-teal/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="container-custom relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h1
                            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="bg-gradient-to-r from-gold to-teal bg-clip-text text-transparent">
                                Operationalize Sandler:
                            </span>{' '}
                            From Training Room to Daily Habit
                        </motion.h1>

                        <motion.p
                            className="text-xl md:text-2xl text-light-muted mb-4 leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            One Click Coaching is the behavioral infrastructure that makes the Sandler Selling System impossible to ignore. capture real-time visibility into upfront contracts, pain funnel depth, and budget discussions.
                        </motion.p>

                        <motion.div
                            className="mb-8 text-lg text-light"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <p className="text-teal font-bold uppercase tracking-widest text-sm mb-2">Designed for Sandler Leaders</p>
                            <p>Eliminate Training Drift • Capture Real Performance • Form Winning Habits</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="flex-1">
                                    <input
                                        {...register('email')}
                                        type="email"
                                        placeholder="Work email"
                                        className="w-full px-6 py-4 rounded-lg bg-navy-light border border-teal/20 text-light placeholder-light-muted/50 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                                    />
                                    {errors.email && (
                                        <p className="text-pink text-sm mt-2">{errors.email.message}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Starting...' : 'Protect Your Training ROI'}
                                </button>
                            </form>
                        </motion.div>

                        <motion.button
                            onClick={() => setShowVideo(true)}
                            className="mt-8 flex items-center gap-3 text-gold hover:text-yellow-400 transition-colors group"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors border border-gold/30">
                                <HiPlay className="text-gold text-2xl ml-1" />
                            </div>
                            <span className="font-semibold">Watch Sandler Execution Demo</span>
                        </motion.button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="relative"
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-teal/30 bg-gradient-to-br from-navy-light to-navy p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-teal rounded-full animate-ping" />
                                    <span className="text-light font-bold">Live Sandler Scorecard</span>
                                </div>
                                <div className="px-4 py-1 bg-teal/20 border border-teal/30 rounded-full">
                                    <span className="text-teal text-xs font-bold uppercase">Upfront Contract: ✅ Verified</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-navy/50 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-light-muted mb-1 uppercase font-bold tracking-tighter">Pain Funnel Depth</div>
                                    <div className="w-full bg-navy h-2 rounded-full mt-2">
                                        <div className="bg-gradient-to-r from-teal to-aqua h-full rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-navy/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-xs text-light-muted uppercase font-bold tracking-tighter">Talk/Listen Ratio</div>
                                        <div className="text-xl font-bold text-light">32 / 68</div>
                                    </div>
                                    <div className="bg-navy/50 p-4 rounded-xl border border-white/5">
                                        <div className="text-xs text-light-muted uppercase font-bold tracking-tighter">Budget Step</div>
                                        <div className="text-xl font-bold text-teal">Completed</div>
                                    </div>
                                </div>

                                <div className="bg-navy/80 p-4 rounded-xl border border-gold/20 italic text-sm text-light-muted">
                                    "You mentioned $50k in lost productivity — is that why we're talking today, or is there more?"
                                    <div className="text-[10px] text-gold mt-2 font-bold not-italic">✓ REVERSE SELLING DETECTED</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {showVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setShowVideo(false)}
                >
                    <div className="relative w-full max-w-4xl aspect-video bg-navy rounded-xl overflow-hidden border border-teal/20 shadow-2xl">
                        <button
                            onClick={() => setShowVideo(false)}
                            className="absolute top-4 right-4 z-10 text-white hover:text-teal bg-navy/50 rounded-full p-2"
                        >
                            <HiXMark size={24} />
                        </button>
                        <div className="w-full h-full flex items-center justify-center text-light bg-navy-light/30 backdrop-blur">
                            <p className="font-bold">Sandler Execution Demo Video</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default SandlerHero
