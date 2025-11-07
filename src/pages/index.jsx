import Category from '@/components/home/Category'
import FeaturedCollection from '@/components/home/FeaturedCollection'
import Hero from '@/components/home/Hero'
import LookBook from '@/components/home/LookBook'
import SocialReels from '@/components/home/SocialReels'
import React from 'react'

const Home = () => {
  return (
    <>
      <Hero />
      <Category />
      <FeaturedCollection/>
      <LookBook/>
      <SocialReels/>
    </>
  )
}

export default Home