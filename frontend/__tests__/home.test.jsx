import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

/* ------------------------------ Mocks ------------------------------ */
jest.mock('lucide-react', () => ({
  Activity: (p) => <svg data-testid="icon-activity" {...p} />,
  HeartPulse: (p) => <svg data-testid="icon-heartpulse" {...p} />,
  BookOpenCheck: (p) => <svg data-testid="icon-bookopencheck" {...p} />,
  Edit: (p) => <svg data-testid="icon-edit" {...p} />,
}));

// Mock next/image
jest.mock('next/image', () => (props) => <img {...props} />);

// Mock shadcn Button
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

// Mock i18n Link
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/* ---------------------------- Messages ----------------------------- */
const messages = {
  home: {
    heroTitle: "Prevent Tomorrow's <strong>Health Challenges</strong> Today",
    heroSubtitle:
      'Personalized meals + workouts, with real-time health insights for a stronger, healthier you.',
    ctaGenerate: 'Generate My Health Plan',
    ctaSample: 'Sample Plan',
    malaysiaReality: 'The Malaysian Health Reality',
    malaysiaSubtitle:
      'Understanding the urgent need for preventive healthcare in Malaysia',
    stat1: '73% of deaths in Malaysia are from NCDs',
    stat1sub: 'Non-communicable diseases are the leading cause of mortality',
    stat2: '3.9M Malaysian adults (18+) have diabetes',
    stat2sub: '≈18.3% of adults',
    stat3: '80% of premature heart disease & strokes are preventable',
    stat3sub: 'Through lifestyle changes & early detection',
    preventionTitle: 'Prevention is Better Than Cure',
    preventionText:
      'Vitaa helps Malaysian adults prevent diabetes, hypertension, and stroke with personalized, culturally relevant health solutions.',
    ctaAnalysis: 'Want to know your <highlight>health risks?</highlight>',
    ctaAnalysisBtn: 'Start Analysis',
    whyTitle: 'Why Vitaa?',
    whyAi: 'AI Preventive Health Analytics',
    whyPersonalised: 'Personalised recommendations for diet and exercise',
    whySubtitle:
      'Comprehensive health management platform designed specifically for Malaysian healthcare needs.',
    why: {
      aiTitle: 'AI Preventive Health Analytics',
      aiDesc:
        'Advanced algorithms analyze your health data to predict and prevent potential health issues before they develop.',
      planTitle: 'Personalised Health Plans',
      planDesc:
        'Customized diet and exercise recommendations tailored to your specific health profile and cultural preferences.',
      libraryTitle: 'NCD Knowledge Library',
      libraryDesc:
        'Comprehensive educational resources about non-communicable diseases with Malaysian-specific statistics and prevention strategies.',
      quizTitle: 'Interactive Health Quiz',
      quizDesc:
        'Engaging quizzes to test your health knowledge and receive personalized recommendations based on your responses.',
    },
  },
};

const resolve = (path) => {
  const keys = path.split('.');
  let value = messages;
  for (const key of keys) value = value ? value[key] : undefined;
  return value ?? path;
};

/* -------- Mock next-intl/server.getTranslations with rich tags ------- */
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockImplementation(async (ns) => {
    const base = (key) => resolve(`${ns}.${key}`);
    const t = (key) => base(key);

    t.rich = (key, mappers) => {
      const raw = base(key);
      if (!mappers) return raw.replace(/<[^>]+>/g, '');

      const parts = [];
      let remaining = raw;
      const tagRegex = /<([a-zA-Z0-9_-]+)>(.*?)<\/\1>/;

      while (true) {
        const m = remaining.match(tagRegex);
        if (!m) {
          parts.push(remaining);
          break;
        }
        const [full, tag, inner] = m;
        const before = remaining.slice(0, m.index);
        const after = remaining.slice(m.index + full.length);

        if (before) parts.push(before);
        const mapped = mappers[tag] ? mappers[tag](inner) : inner;
        parts.push(mapped);
        remaining = after;
      }
      return <>{parts}</>;
    };

    return t;
  }),
}));

/* --------- Import the page AFTER mocks --------- */
const loadHomePage = async () => {
  const candidates = [
    '@/app/en/page',
    '@/app/page',
    '@/app/(site)/page',
    '@/app/[locale]/page',
  ];

  for (const p of candidates) {
    try {
      const mod = await import(p);
      return mod.default || mod;
    } catch {
      // continue
    }
  }

  throw new Error("Couldn't import HomePage. Update candidates in test to your real file path.");
};

/* ------------------------------ Tests ------------------------------ */
describe('HomePage (server component)', () => {
  it('renders hero title and subtitle', async () => {
    const HomePage = await loadHomePage();
    const element = await (typeof HomePage === 'function' ? HomePage() : HomePage);
    render(element);

    expect(
      screen.getByRole('heading', { level: 1, name: /Prevent Tomorrow's Health Challenges Today/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Personalized meals \+ workouts, with real-time health insights for a stronger, healthier you\./i
      )
    ).toBeInTheDocument();
  });

  it('primary CTAs point to the correct routes', async () => {
    const HomePage = await loadHomePage();
    const element = await (typeof HomePage === 'function' ? HomePage() : HomePage);
    render(element);

    expect(screen.getByRole('link', { name: /Generate My Health Plan/i })).toHaveAttribute(
      'href',
      '/planform'
    );
    expect(screen.getByRole('link', { name: /Start Analysis/i })).toHaveAttribute(
      'href',
      '/analysisform'
    );
  });

  it('shows Malaysia stats with key numbers', async () => {
    const HomePage = await loadHomePage();
    const element = await (typeof HomePage === 'function' ? HomePage() : HomePage);
    render(element);

    expect(screen.getByRole('heading', { name: /The Malaysian Health Reality/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Understanding the urgent need for preventive healthcare in Malaysia/i)
    ).toBeInTheDocument();

    expect(screen.getByText('73%')).toBeInTheDocument();
    expect(screen.getByText('3.9M')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();

    expect(screen.getByText(/73% of deaths in Malaysia are from NCDs/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.9M Malaysian adults \(18\+\) have diabetes/i)).toBeInTheDocument();
    expect(
      screen.getByText(/80% of premature heart disease & strokes are preventable/i)
    ).toBeInTheDocument();
  });

  it('renders prevention pill', async () => {
    const HomePage = await loadHomePage();
    const element = await (typeof HomePage === 'function' ? HomePage() : HomePage);
    render(element);

    expect(screen.getByRole('heading', { name: /Prevention is Better Than Cure/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Vitaa helps Malaysian adults prevent diabetes, hypertension, and stroke with personalized, culturally relevant health solutions\./i
      )
    ).toBeInTheDocument();
  });

  it('shows "Why Vitaa?" section with four feature blocks and icons', async () => {
    const HomePage = await loadHomePage();
    const element = await (typeof HomePage === 'function' ? HomePage() : HomePage);
    render(element);

    expect(screen.getByRole('heading', { name: /Why Vitaa\?/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Comprehensive health management platform designed specifically for Malaysian healthcare needs\./i
      )
    ).toBeInTheDocument();

    expect(screen.getByText(/AI Preventive Health Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Personalised Health Plans/i)).toBeInTheDocument();
    expect(screen.getByText(/NCD Knowledge Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Health Quiz/i)).toBeInTheDocument();

    expect(screen.getByTestId('icon-activity')).toBeInTheDocument();
    expect(screen.getByTestId('icon-heartpulse')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bookopencheck')).toBeInTheDocument();
    expect(screen.getByTestId('icon-edit')).toBeInTheDocument();
  });

  it('renders hero and CTA images with alt text', async () => {
    const HomePage = await loadHomePage();
    const element = await (typeof HomePage === 'function' ? HomePage() : HomePage);
    render(element);

    expect(screen.getByAltText(/Healthy lifestyle/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Health profile cards/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Risk widgets/i)).toBeInTheDocument();
  });
});
