import Hero from '../components/sections/Hero'
import Benefits from '../components/sections/Benefits'
import Courses from '../components/sections/Courses'
import VideoPreview from '../components/sections/VideoPreview'
import Teachers from '../components/sections/Teachers'
import Testimonials from '../components/sections/Testimonials'
import RegistrationForm from '../components/sections/RegistrationForm'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Benefits />
      <Courses />
      <VideoPreview />
      <Teachers />
      <Testimonials />
      <RegistrationForm />
    </>
  )
}
