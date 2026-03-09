import SeoHeader from "@/components/seo/SeoHeader";

const Custom404 = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <div style={style}>
        <p>Sorry, we couldn't find the page you're looking for.</p>
        <p>Page not found</p>
      </div>
    </>
  );
}

export default Custom404;

export async function getStaticProps() {
  const meta = {
    title: "Page Not Found – Nahara Jewellery",
    description: "The page you’re looking for doesn’t exist. Explore our fine jewellery collection instead.",
    keywords: ["404", "page not found", "Nahara error page"],
    primaryKeywords: ["404 page"],
    author: "Nahara",
    robots: "noindex, follow",
    og: {
      title: "Page Not Found – Nahara Jewellery",
      description: "This page does not exist. Explore our jewellery collection instead.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Page Not Found – Nahara Jewellery",
      description: "Page not found on Nahara.",
    }
  };

  return { props: { meta } };
}
const style = {
  height: '100vh',
  fontSize: '1.875rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  paddingLeft: '1.5rem',
  paddingRight: '1.5rem',
}

