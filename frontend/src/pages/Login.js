import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import '../landing.css';

export default function Login() {
  const { firebaseUser, user, needsOnboarding, signInWithGoogle, authError, clearAuthError, signingIn, loading } = useAuth();
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(0);
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const slideTimerRef = useRef(null);

  useEffect(() => {
    if (!loading && firebaseUser) {
      if (needsOnboarding) {
        navigate('/signup', { replace: true });
      } else if (user) {
        navigate(user.role === 'CONTRACTOR' ? '/contractor-dashboard' : '/new-project', { replace: true });
      } else {
        navigate('/signup', { replace: true });
      }
    }
  }, [firebaseUser, user, needsOnboarding, loading, navigate]);

  // Hero slider autoplay
  useEffect(() => {
    const play = () => {
      slideTimerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 3);
      }, 6000);
    };
    play();
    return () => clearInterval(slideTimerRef.current);
  }, []);

  const handleGetQuoteClick = async (serviceName) => {
    clearAuthError();
    if (serviceName) setSelectedService(serviceName);
    if (firebaseUser) {
      navigate('/new-project');
      return;
    }
    try {
      await signInWithGoogle();
      navigate('/new-project');
    } catch (_err) {
      // Auth error handled by context
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setModalOpen(false);
      setModalSuccess(false);
      handleGetQuoteClick(selectedService);
    }, 1500);
  };

  const faqItems = [
    { q: 'What is Brikko?', a: 'Brikko is a trusted B2B marketplace and residential construction estimator that connects users with verified contractors, suppliers, manufacturers and consultants across construction, engineering and industrial sectors.' },
    { q: 'How are businesses verified on Brikko?', a: 'Businesses are verified based on company registration, experience, portfolio, customer feedback and industry reputation to ensure trust and reliability.' },
    { q: 'Why should I use Brikko instead of searching manually?', a: 'Brikko saves time with verified listings, transparent profiles, instant cost estimates, easy comparison and direct access to contractors, suppliers, manufacturers and consultants in one platform.' },
    { q: 'Can I find service providers near me?', a: 'Yes. Brikko helps you find local contractors, suppliers, manufacturers and consultants based on your location, pincode and project requirements.' },
    { q: 'How does Brikko work?', a: 'Search and connect with verified businesses, compare services, review profiles, generate itemized cost estimates and contact professionals directly.' },
    { q: 'Can I compare multiple quotations or businesses?', a: 'Yes. You can request and compare multiple quotations and evaluate businesses on pricing, experience, reviews and service quality.' },
    { q: 'What types of businesses are listed on Brikko?', a: 'Brikko features contractors, suppliers, manufacturers and consultants across construction, infrastructure, engineering and industrial sectors.' },
    { q: 'Can I view previous projects and reviews?', a: 'Yes. Verified businesses showcase portfolios, completed projects, certifications and customer reviews to help you decide.' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f7fc', color: '#0f2038', overflowX: 'hidden' }}>
      <a className="skip" href="#main">Skip to content</a>

      {authError && (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2, px: 2 }}>
          <Alert severity="error">{authError}</Alert>
        </Box>
      )}

      <header className="site-header" id="home">
        <div className="container nav-wrap">
          <a className="brand" href="#home" aria-label="Brikko home">
            <img src="/logo-full.jpg" alt="Brikko - Build Smart. Build with Brikko." width="525" height="198" />
          </a>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
          </button>
          <nav className={`main-nav ${menuOpen ? 'open' : ''}`} id="nav" aria-label="Main">
            <a href="#about" onClick={() => setMenuOpen(false)}>About us</a>
            <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact us</a>
            <button
              className="btn btn-sm quote-btn"
              type="button"
              disabled={signingIn}
              onClick={() => {
                setMenuOpen(false);
                handleGetQuoteClick('General');
              }}
            >
              {signingIn ? <CircularProgress size={16} color="inherit" /> : 'Get quote'}
            </button>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" aria-roledescription="carousel" aria-label="Brikko highlights">
          <div className={`hero-slide ${currentSlide === 0 ? 'active' : ''}`} aria-hidden={currentSlide !== 0}>
            <div className="hero-image hero-contractors" role="img" aria-label="Construction workers on site"></div>
            <div className="container hero-content">
              <p className="kicker">Trusted contractors</p>
              <h1>Verified contractors for construction, renovation and project work.</h1>
              <button
                className="btn quote-btn"
                type="button"
                disabled={signingIn}
                onClick={() => handleGetQuoteClick('Contractor')}
              >
                {signingIn ? <CircularProgress size={18} color="inherit" /> : 'Get quote'}
              </button>
            </div>
          </div>
          <div className={`hero-slide ${currentSlide === 1 ? 'active' : ''}`} aria-hidden={currentSlide !== 1}>
            <div className="hero-image hero-suppliers" role="img" aria-label="Industrial manufacturing floor"></div>
            <div className="container hero-content">
              <p className="kicker">Reliable suppliers and manufacturers</p>
              <h1>Quality materials and manufacturing solutions from trusted sources.</h1>
              <button
                className="btn quote-btn"
                type="button"
                disabled={signingIn}
                onClick={() => handleGetQuoteClick('Supplier/Manufacturer')}
              >
                {signingIn ? <CircularProgress size={18} color="inherit" /> : 'Get quote'}
              </button>
            </div>
          </div>
          <div className={`hero-slide ${currentSlide === 2 ? 'active' : ''}`} aria-hidden={currentSlide !== 2}>
            <div className="hero-image hero-consultants" role="img" aria-label="Modern office for consultants"></div>
            <div className="container hero-content">
              <p className="kicker">Expert consultants</p>
              <h1>Expert guidance from engineers, architects and industry professionals.</h1>
              <button
                className="btn quote-btn"
                type="button"
                disabled={signingIn}
                onClick={() => handleGetQuoteClick('Consultant')}
              >
                {signingIn ? <CircularProgress size={18} color="inherit" /> : 'Get quote'}
              </button>
            </div>
          </div>
          <div className="slider-ui container">
            <div className="dots" role="tablist" aria-label="Choose slide">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  className={`dot ${currentSlide === idx ? 'active' : ''}`}
                  data-slide={idx}
                  aria-label={`Slide ${idx + 1}`}
                  aria-current={currentSlide === idx}
                  onClick={() => setCurrentSlide(idx)}
                ></button>
              ))}
            </div>
            <div className="arrows">
              <button
                className="slider-arrow prev"
                aria-label="Previous slide"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + 3) % 3)}
              >
                ‹
              </button>
              <button
                className="slider-arrow next"
                aria-label="Next slide"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}
              >
                ›
              </button>
            </div>
          </div>
        </section>

        <section className="section about" id="about">
          <div className="container about-grid">
            <div className="about-image-wrap">
              <img
                className="about-image"
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1100&q=80"
                alt="Builders reviewing plans on site"
                loading="lazy"
                width="1100"
                height="1300"
              />
              <div className="badge">
                <strong>100%</strong>
                <span>Verified<br />connections</span>
              </div>
            </div>
            <div className="about-copy">
              <p className="kicker">Build smart. Build with Brikko.</p>
              <h2>Building your dream home starts with finding the right builder</h2>
              <p>Brikko connects businesses and individuals with verified contractors, suppliers, manufacturers and consultants. Our mission is to make finding reliable providers simple, through a transparent and efficient marketplace.</p>
              <p>Planning a construction project, sourcing materials, looking for manufacturing solutions or professional advice? Brikko helps you discover and connect with the right experts.</p>
              <a className="text-link" href="#services">Explore our services</a>
            </div>
          </div>
        </section>

        <section className="section services" id="services">
          <div className="container">
            <div className="heading">
              <p className="kicker">Our services</p>
              <h2>Three kinds of professionals, one platform</h2>
              <p>Connect with reliable professionals and businesses for your construction and industrial requirements.</p>
            </div>
            <div className="service-grid">
              <article className="service-card">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80"
                  alt=""
                  loading="lazy"
                  width="900"
                  height="600"
                />
                <div className="service-body">
                  <h3>Contractor</h3>
                  <p>Find qualified contractors for construction, renovation, maintenance and specialised project services.</p>
                  <button
                    className="btn btn-ghost quote-btn"
                    type="button"
                    onClick={() => handleGetQuoteClick('Contractor')}
                  >
                    Quote from contractors
                  </button>
                </div>
              </article>
              <article className="service-card">
                <img
                  src="https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=80"
                  alt=""
                  loading="lazy"
                  width="900"
                  height="600"
                />
                <div className="service-body">
                  <h3>Supplier / Manufacturer</h3>
                  <p>Connect with trusted suppliers and manufacturers offering materials, products, equipment and custom solutions.</p>
                  <button
                    className="btn btn-ghost quote-btn"
                    type="button"
                    onClick={() => handleGetQuoteClick('Supplier/Manufacturer')}
                  >
                    Quote from suppliers
                  </button>
                </div>
              </article>
              <article className="service-card">
                <img
                  src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80"
                  alt=""
                  loading="lazy"
                  width="900"
                  height="600"
                />
                <div className="service-body">
                  <h3>Consultant</h3>
                  <p>Engage experienced consultants, engineers, architects and project advisors for expert guidance and planning.</p>
                  <button
                    className="btn btn-ghost quote-btn"
                    type="button"
                    onClick={() => handleGetQuoteClick('Consultant')}
                  >
                    Quote from consultants
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section process" id="how">
          <div className="container">
            <div className="heading">
              <p className="kicker">Simple and transparent</p>
              <h2>How Brikko works</h2>
            </div>
            <ol className="steps">
              <li><h3>Tell us your requirement</h3><p>Share your construction, material or consulting requirement.</p></li>
              <li><h3>Find the right expert</h3><p>Discover suitable professionals and businesses for your project.</p></li>
              <li><h3>Compare and connect</h3><p>Review profiles, quotations and experience, then connect directly.</p></li>
              <li><h3>Start your project</h3><p>Move forward with the professional or business that fits your needs.</p></li>
            </ol>
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="container faq-grid">
            <div className="faq-intro">
              <p className="kicker">Frequently asked questions</p>
              <h2>Everything you need to know about Brikko</h2>
              <p>Quick answers about our marketplace, verification and connections.</p>
              <button
                className="btn quote-btn"
                type="button"
                onClick={() => handleGetQuoteClick('General')}
              >
                Get quote
              </button>
            </div>
            <div className="faq-list">
              {faqItems.map((item, idx) => {
                const isOpen = faqOpenIndex === idx;
                return (
                  <div key={item.q} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <h3>
                      <button
                        className="faq-question"
                        aria-expanded={isOpen}
                        onClick={() => setFaqOpenIndex(isOpen ? -1 : idx)}
                      >
                        {item.q}
                      </button>
                    </h3>
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="container cta-inner">
            <h2>Ready to find the right professional for your project?</h2>
            <button
              className="btn btn-light quote-btn"
              type="button"
              onClick={() => handleGetQuoteClick('General')}
            >
              Get quote
            </button>
          </div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#home" aria-label="Brikko home">
              <img src="/logo-full.jpg" alt="Brikko - Build Smart. Build with Brikko." width="525" height="198" />
            </a>
            <p>Connecting businesses and individuals with trusted construction and industrial professionals.</p>
            <div className="socials">
              <a href="#home" aria-label="Facebook">f</a>
              <a href="#home" aria-label="Instagram">◎</a>
              <a href="#home" aria-label="LinkedIn">in</a>
            </div>
          </div>
          <div>
            <h3>Office contact</h3>
            <p>Joyville Hinjewadi, Phase 1<br />Pune, MH (411057)</p>
            <a href="tel:+917219391949">+91-7219391949</a>
            <a href="mailto:info@brikko.com">info@brikko.com</a>
          </div>
          <div>
            <h3>Service areas</h3>
            <a href="#services">Contractor</a>
            <a href="#services">Supplier/Manufacturer</a>
            <a href="#services">Consultant</a>
          </div>
          <div>
            <h3>Useful pages</h3>
            <a href="#about">About us</a>
            <a href="#services">Services</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact us</a>
          </div>
          <div>
            <h3>Newsletter</h3>
            <p>Latest news and updates from Brikko.</p>
            <form
              className="newsletter"
              onSubmit={(e) => {
                e.preventDefault();
                setNewsletterMsg('Thanks for subscribing to Brikko.');
                e.currentTarget.reset();
              }}
            >
              <label className="sr" htmlFor="nl">Email</label>
              <input id="nl" type="email" placeholder="Your email" required />
              <button type="submit" aria-label="Subscribe">→</button>
            </form>
            {newsletterMsg && <p className="nl-msg" role="status">{newsletterMsg}</p>}
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">© {new Date().getFullYear()} Brikko. All rights reserved.</div>
        </div>
      </footer>

      {modalOpen && (
        <div className="modal show" role="dialog" aria-modal="true" aria-labelledby="qm-title">
          <div className="modal-card">
            <button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button>
            <h2 id="qm-title">Tell us what you need</h2>
            <p>Submit your requirement and our team will help you connect with the right professional.</p>
            {!modalSuccess ? (
              <form onSubmit={handleModalSubmit}>
                <div className="form-row">
                  <input name="name" placeholder="Your name" autoComplete="name" required />
                  <input name="phone" type="tel" placeholder="Phone number" autoComplete="tel" required />
                </div>
                <input name="email" type="email" placeholder="Email address" autoComplete="email" />
                <select name="service" defaultValue={selectedService} required aria-label="Service">
                  <option value="">Select service</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Supplier/Manufacturer">Supplier/Manufacturer</option>
                  <option value="Consultant">Consultant</option>
                </select>
                <textarea name="message" rows="4" placeholder="Describe your requirement" required></textarea>
                <button className="btn" type="submit">Send requirement</button>
              </form>
            ) : (
              <div className="form-success" role="status">Thank you! We have received your requirement and will contact you soon.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
