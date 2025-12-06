import { useRef, useLayoutEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from 'framer-motion';
import AboutImageEffect from './AboutImageEffect';

function useElementWidth(ref) {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    function updateWidth() {
      if (ref.current) {
        setWidth(ref.current.getBoundingClientRect().width);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref]);

  return width;
}

export const ScrollVelocity = ({
  scrollContainerRef,
  items = [],
  velocity = 50,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 100], output: [0, 5] },
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle
}) => {
  const isHovering = useMotionValue(0);

  const aboutMarqueeItems = [
    <div className="about_marquee_paren">

      <div className="about_marque_img_paren_1">
        <div className="marq_img_paren">
          <div onMouseEnter={() => isHovering.set(1)}
            onMouseLeave={() => isHovering.set(0)}
            className="marq_img_1">
            <AboutImageEffect imageUrl="/images/aboutpage/about_img1.webp" />
          </div>
          <div onMouseEnter={() => isHovering.set(1)}
            onMouseLeave={() => isHovering.set(0)} className="marq_img_2">
            <AboutImageEffect imageUrl="/images/aboutpage/about_img2.webp" />
          </div>
        </div>
        <div onMouseEnter={() => isHovering.set(1)}
          onMouseLeave={() => isHovering.set(0)} className="marq_img_3">
          <AboutImageEffect imageUrl="/images/aboutpage/landscape_img1.webp" />
        </div>
      </div>

      <div className="about_marq_txt_paren">
        <div className="about_txt_upper">
          <div className="about_txt_img_paren">
            <div onMouseEnter={() => isHovering.set(1)}
              onMouseLeave={() => isHovering.set(0)} className="about_txt_img">
              <AboutImageEffect imageUrl="/images/aboutpage/desc_img.webp" />
            </div>
          </div>
          <p className='  text-base uppercase '>Behind Rare Element</p>
        </div>
        <div className=" text-xl">
          <p className='thin italic'>“ Nahara was born from the idea that beauty should be honest and thoughtful. We create slowly, with intention, allowing every design to carry a story. What you see here is more than a brand it’s a journey shaped with clarity, purpose, and heart.”</p>
        </div>
      </div>

      <div className="about_marque_img_paren_2">
        <div onMouseEnter={() => isHovering.set(1)}
          onMouseLeave={() => isHovering.set(0)} className="marq_img_4">
          <AboutImageEffect imageUrl="/images/aboutpage/landscape_img2.webp" />
        </div>
        <div className="marq_img_paren_next">
          <div onMouseEnter={() => isHovering.set(1)}
            onMouseLeave={() => isHovering.set(0)} className="marq_img_1">
            <AboutImageEffect imageUrl="/images/aboutpage/about_img3.webp" />
          </div>
          <div onMouseEnter={() => isHovering.set(1)}
            onMouseLeave={() => isHovering.set(0)} className="marq_img_2">
            <AboutImageEffect imageUrl="/images/aboutpage/about_img4.webp" />
          </div>
        </div>
      </div>

      <div className="about_marq_txt_paren">
        <div className="about_txt_upper">
          <div className="about_txt_img_paren">
            <div onMouseEnter={() => isHovering.set(1)}
              onMouseLeave={() => isHovering.set(0)} className="about_txt_img">
              <AboutImageEffect imageUrl="/images/aboutpage/desc_img.webp" />
            </div>
          </div>
          <p className='  text-base uppercase '>Behind Rare Element</p>
        </div>
        <div className=" text-xl">
          <p className='thin italic'>“ Nahara was born from the idea that beauty should be honest and thoughtful. We create slowly, with intention, allowing every design to carry a story. What you see here is more than a brand it’s a journey shaped with clarity, purpose, and heart.”</p>
        </div>
      </div>

    </div>
  ]

  function VelocityItem({
    children,
    baseVelocity = velocity
  }) {
    const baseX = useMotionValue(0);
    const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {};
    const { scrollY } = useScroll(scrollOptions);
    const scrollVelocity = useVelocity(scrollY);

    const smoothVelocity = useSpring(scrollVelocity, {
      damping,
      stiffness
    });
    const hoverSmooth = useSpring(isHovering, {
      damping: 20,
      stiffness: 300,
    });

    const velocityFactor = useTransform(
      smoothVelocity,
      velocityMapping.input,
      velocityMapping.output,
      { clamp: false }
    );

    const copyRef = useRef(null);
    const copyWidth = useElementWidth(copyRef);

    function wrap(min, max, v) {
      const range = max - min;
      const mod = (((v - min) % range) + range) % range;
      return mod + min;
    }

    const x = useTransform(baseX, v => {
      if (copyWidth === 0) return '0px';
      return `${wrap(-copyWidth, 0, v)}px`;
    });

    const directionFactor = useRef(1);

    useAnimationFrame((_, delta) => {
      const hoverFactor = 1 - hoverSmooth.get(); // 1 → moving, 0 → paused
      let moveBy =
        directionFactor.current *
        baseVelocity *
        (delta / 1000) *
        hoverFactor;

      if (velocityFactor.get() < 0) directionFactor.current = -1;
      else if (velocityFactor.get() > 0) directionFactor.current = 1;

      moveBy +=
        directionFactor.current *
        moveBy *
        velocityFactor.get() *
        hoverFactor;

      baseX.set(baseX.get() + moveBy);
    });

    return (
      <div className={parallaxClassName} style={parallaxStyle}>
        <motion.div className={scrollerClassName} style={{ x, ...scrollerStyle }}>
          {Array.from({ length: numCopies }).map((_, i) => (
            <div
              key={i}
              ref={i === 0 ? copyRef : null}
              className={className}
              style={{ flexShrink: 0 }}
            >
              {children}
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <section>
      {aboutMarqueeItems.map((item, index) => (
        <VelocityItem
          key={index}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
        >
          {item}
        </VelocityItem>
      ))}
    </section>
  );
};

export default ScrollVelocity;
