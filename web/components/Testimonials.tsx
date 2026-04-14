'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

const testimonials = [
  {
    quote: "Our reps were trained in Sandler but weren't using it consistently. This AI catches every missed pain funnel question and gives them exact scripts. Close rate up 28% in 90 days.",
    author: 'Sarah Mitchell',
    title: 'VP of Sales',
    company: 'TechFlow Solutions',
    image: '👩‍💼'
  },
  {
    quote: "I was skeptical about AI coaching. But the tactical scripts are gold. It's like having a sales coach review every call—except it happens instantly.",
    author: 'Marcus Johnson',
    title: 'Senior Account Executive',
    company: 'CloudScale',
    image: '👨‍💼'
  },
  {
    quote: "We switched from Challenger to MEDDIC. This platform made the transition seamless. Every rep gets coaching in the new methodology on every call.",
    author: 'Jennifer Park',
    title: 'Director of Revenue Operations',
    company: 'DataPrime',
    image: '👩‍💻'
  }
]

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => setCurrentIndex((currentIndex + 1) % testimonials.length)
  const prev = () => setCurrentIndex((currentIndex - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="section-padding bg-navy">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Sales Teams Using Our Platform{' '}
            <span className="text-teal">Close More Deals</span>
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="card"
          >
            <div className="text-6xl text-teal mb-6">"</div>
            <p className="text-xl md:text-2xl text-light mb-8 leading-relaxed italic">
              {testimonials[currentIndex].quote}
            </p>

            <div className="flex items-center gap-4">
              <div className="text-5xl">{testimonials[currentIndex].image}</div>
              <div>
                <div className="font-bold text-lg">{testimonials[currentIndex].author}</div>
                <div className="text-light-muted">
                  {testimonials[currentIndex].title}, {testimonials[currentIndex].company}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full bg-navy-light border border-teal/20 hover:border-teal hover:bg-teal/10 flex items-center justify-center transition-all"
            >
              <HiChevronLeft className="text-teal text-2xl" />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-teal w-8' : 'bg-teal/30'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-12 h-12 rounded-full bg-navy-light border border-teal/20 hover:border-teal hover:bg-teal/10 flex items-center justify-center transition-all"
            >
              <HiChevronRight className="text-teal text-2xl" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
