import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="notfound-wrapper">
      <h2 className="notfound-title">Page Not Found</h2>

      <p className="notfound-description">
        Oops! The page you are looking for does not exist.
      </p>

      <Link href="/" className="notfound-button">
        Return Home
      </Link>
    </div>
  )
}