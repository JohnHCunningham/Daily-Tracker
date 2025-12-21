'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi'
import { motion } from 'framer-motion'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(2, 'Company name is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    try {
      // Send to n8n webhook for email notification
      await fetch('https://aiadvantagesolutions.app.n8n.cloud/webhook/701fa496-37f8-43c0-9e00-1eb8973b148f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      // Always show success - if webhook received the data, that's enough
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      reset()
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('Failed to send message. Please try emailing us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="section-padding bg-navy-dark">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get in <span className="text-teal">Touch</span>
          </h2>
          <p className="text-xl text-light-muted max-w-3xl mx-auto">
            Ready to transform your sales team? Let's talk about how Daily Tracker can help you execute your methodology with precision.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-light mb-6">Contact Information</h3>
            <p className="text-light-muted mb-8">
              Have questions? We're here to help. Reach out to us and we'll respond as soon as possible.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-navy p-3 rounded-lg border border-teal/20">
                  <HiMail className="text-teal text-2xl" />
                </div>
                <div>
                  <h4 className="font-semibold text-light mb-1">Email</h4>
                  <a
                    href="mailto:john@aiadvantagesolutions.ca"
                    className="text-light-muted hover:text-teal transition-colors"
                  >
                    john@aiadvantagesolutions.ca
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-navy p-3 rounded-lg border border-teal/20">
                  <HiPhone className="text-teal text-2xl" />
                </div>
                <div>
                  <h4 className="font-semibold text-light mb-1">Phone</h4>
                  <a
                    href="tel:+19055198983"
                    className="text-light-muted hover:text-teal transition-colors"
                  >
                    (905) 519-8983
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-navy p-3 rounded-lg border border-teal/20">
                  <HiLocationMarker className="text-teal text-2xl" />
                </div>
                <div>
                  <h4 className="font-semibold text-light mb-1">Address</h4>
                  <p className="text-light-muted">
                    1880 Main St. West Suite 303<br />
                    Hamilton, ON L8S 4P8<br />
                    Canada
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-navy rounded-xl border border-teal/20">
              <h4 className="font-semibold text-light mb-2">Business Hours</h4>
              <p className="text-light-muted text-sm">
                Monday - Friday: 9:00 AM - 5:00 PM EST<br />
                Saturday - Sunday: Closed
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-light mb-2">
                  Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  placeholder="John Smith"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-pink">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light mb-2">
                  Email *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  placeholder="john@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-pink">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-light mb-2">
                  Company *
                </label>
                <input
                  {...register('company')}
                  type="text"
                  id="company"
                  className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  placeholder="Your Company Name"
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-pink">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-light mb-2">
                  Company Website (Optional)
                </label>
                <input
                  {...register('website')}
                  type="url"
                  id="website"
                  className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  placeholder="https://yourcompany.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-pink">{errors.website.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-light mb-2">
                  LinkedIn Profile (Optional)
                </label>
                <input
                  {...register('linkedin')}
                  type="url"
                  id="linkedin"
                  className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                {errors.linkedin && (
                  <p className="mt-1 text-sm text-pink">{errors.linkedin.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-light mb-2">
                  Phone (Optional)
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-light mb-2">
                  Message *
                </label>
                <textarea
                  {...register('message')}
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3 bg-navy border border-navy-light rounded-lg text-light placeholder-light-muted focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none transition-colors resize-none"
                  placeholder="Tell us about your sales team and how we can help..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-pink">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-teal to-aqua text-navy font-bold py-4 px-6 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact
