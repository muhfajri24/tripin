import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/dist/SplitText';
import DrawSVGPlugin from 'gsap/dist/DrawSVGPlugin';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
import ScrollToPlugin from 'gsap/dist/ScrollToPlugin';
import TextPlugin from 'gsap/dist/TextPlugin';
import Flip from 'gsap/dist/Flip';
import {
  ArrowRight,
  Search,
  Store,
  Sparkles,
  Clock,
  MapPin,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import { mockLocalBusinesses, mockDestinations } from '../data/mockData';

// Register GSAP plugins once at module initialization (guard ScrollTrigger in JSDOM without matchMedia)
if (typeof window === 'undefined' || typeof window.matchMedia === 'function') {
  gsap.registerPlugin(useGSAP, SplitText, DrawSVGPlugin, ScrollTrigger, ScrollToPlugin, TextPlugin, Flip);
} else {
  gsap.registerPlugin(useGSAP, SplitText, DrawSVGPlugin, ScrollToPlugin, TextPlugin, Flip);
}

const typingRegions = ['Padang', 'Raja Ampat', 'Yogyakarta', 'Bali'];

const mapPins = [
  { name: 'Sabang', x: 50, y: 45, labelDx: 8, labelDy: -10, align: 'start' },
  { name: 'Padang', x: 128, y: 163, labelDx: -10, labelDy: 4, align: 'end' },
  { name: 'Bandung', x: 240, y: 266, labelDx: -8, labelDy: 18, align: 'end' },
  { name: 'Yogyakarta', x: 282, y: 281, labelDx: 0, labelDy: 22, align: 'middle' },
  { name: 'Bali', x: 357, y: 296, labelDx: 8, labelDy: 20, align: 'start' },
  { name: 'Makassar', x: 422, y: 235, labelDx: -10, labelDy: -8, align: 'end' },
  { name: 'Raja Ampat', x: 593, y: 156, labelDx: 0, labelDy: -14, align: 'middle' },
  { name: 'Merauke', x: 745, y: 293, labelDx: -6, labelDy: 20, align: 'end' },
];

const routePathD =
  'M 50 45 Q 75 118 128 163 Q 170 232 240 266 Q 262 278 282 281 Q 322 296 357 296 Q 395 274 422 235 Q 508 168 593 156 Q 685 205 745 293';

const caraKerjaPrompt =
  'Saya mau liburan ke Yogyakarta 2 hari, pagi kulineran, siang wisata alam, sore budaya, budget Rp1 juta';

const miniStops = [
  { id: 1, name: 'Gudeg Yu Djum', time: '08:00 · Pagi · Kuliner', estimate: 'Estimasi Rp150.000', x: 112, y: 118, labelDx: -10, labelDy: -12, align: 'end' },
  { id: 2, name: 'Hutan Pinus & Breksi', time: '12:30 · Siang · Wisata Alam', estimate: 'Estimasi Rp350.000', x: 252, y: 78, labelDx: -8, labelDy: -12, align: 'end' },
  { id: 3, name: 'Keraton & Sentra Batik', time: '16:00 · Sore · Budaya', estimate: 'Estimasi Rp450.000', x: 170, y: 222, labelDx: 12, labelDy: 16, align: 'start' },
];

const miniRouteSegments = [
  'M 112 118 Q 186 64 252 78',
  'M 252 78 Q 246 172 170 222',
];

const miniRoutePathD = miniRouteSegments.join(' ');

// Contoh data hardcoded untuk section Mode Optimasi (5 tempat di Yogyakarta)
const modeSamplePlaces = {
  beringharjo: { id: 'beringharjo', name: 'Pasar Beringharjo' },
  keraton: { id: 'keraton', name: 'Keraton Yogyakarta' },
  'taman-sari': { id: 'taman-sari', name: 'Taman Sari' },
  prambanan: { id: 'prambanan', name: 'Candi Prambanan' },
  'pinus-pengger': { id: 'pinus-pengger', name: 'Hutan Pinus Pengger' },
};

const optimizationModes = [
  {
    id: 'budget',
    label: 'Budget Friendly',
    description: 'Prioritaskan destinasi hemat biaya dengan kuliner lokal autentik yang ramah kantong.',
    order: ['beringharjo', 'keraton', 'taman-sari', 'pinus-pengger', 'prambanan'],
    cost: 350000,
    hours: 7,
    places: 5,
  },
  {
    id: 'time',
    label: 'Time Efficient',
    description: 'Susun urutan rute terdekat agar waktu tempuh antar tempat paling singkat.',
    order: ['keraton', 'taman-sari', 'beringharjo', 'prambanan', 'pinus-pengger'],
    cost: 480000,
    hours: 5,
    places: 5,
  },
  {
    id: 'explore',
    label: 'Explore More',
    description: 'Maksimalkan variasi pengalaman dari warisan budaya, wisata alam, hingga pasar lokal.',
    order: ['prambanan', 'pinus-pengger', 'keraton', 'taman-sari', 'beringharjo'],
    cost: 620000,
    hours: 10,
    places: 5,
  },
];

const exploreHdImages = {
  'dest-sum-1': '/images/explore/sumatra-1-toba.jpg',
  'lb-sum-1': '/images/explore/sumatra-2-ulos.jpg',
  'lb-sum-2': '/images/explore/sumatra-3-rendang.jpg',
  'dest-sum-2': '/images/explore/sumatra-4-ngarai.jpg',
  'ex-sum-5': '/images/explore/sumatra-5-belitung.jpg',
  'dest-jaw-1': '/images/explore/jawa-1-bromo.jpg',
  'lb-jaw-2': '/images/explore/jawa-2-gudeg.jpg',
  'lb-jaw-1': '/images/explore/jawa-3-angklung.jpg',
  'dest-jaw-2': '/images/explore/jawa-4-prambanan.jpg',
  'ex-jaw-5': '/images/explore/jawa-5-ijen.jpg',
  'dest-ntt-1': '/images/explore/balinusra-1-padar.jpg',
  'lb-bali-2': '/images/explore/balinusra-2-celuk.jpg',
  'lb-bali-1': '/images/explore/balinusra-3-nasiayam.jpg',
  'dest-bali-1': '/images/explore/balinusra-4-uluwatu.jpg',
  'lb-ntb-2': '/images/explore/balinusra-5-sade.jpg',
  'dest-kal-1': '/images/explore/kalimantan-1-tanjungputing.jpg',
  'lb-kal-1': '/images/explore/kalimantan-2-sotobanjar.jpg',
  'ex-kal-3': '/images/explore/kalimantan-3-derawan.jpg',
  'ex-kal-4': '/images/explore/kalimantan-4-terapung.jpg',
  'ex-kal-5': '/images/explore/kalimantan-5-dayak.jpg',
  'dest-sul-1': '/images/explore/sulawesi-1-ketekesu.jpg',
  'lb-sul-1': '/images/explore/sulawesi-2-kopitoraja.jpg',
  'lb-sul-2': '/images/explore/sulawesi-3-pinisi.jpg',
  'ex-sul-4': '/images/explore/sulawesi-4-bunaken.jpg',
  'ex-sul-5': '/images/explore/sulawesi-5-wakatobi.jpg',
  'dest-pap-2': '/images/explore/malukupapua-1-piaynemo.jpg',
  'lb-mal-1': '/images/explore/malukupapua-2-pala.jpg',
  'lb-pap-2': '/images/explore/malukupapua-3-noken.jpg',
  'dest-mal-1': '/images/explore/malukupapua-4-belgica.jpg',
  'ex-mp-5': '/images/explore/malukupapua-5-baliem.jpg',
};

const fallbackHeroByRegion = {
  sumatra: '/images/hero/hero-ampera.jpg',
  jawa: '/images/hero/hero-bromo.jpg',
  'bali-nusra': '/images/hero/hero-bali.jpg',
  kalimantan: '/images/hero/hero-ampera.jpg',
  sulawesi: '/images/hero/hero-bandaneira.jpg',
  'maluku-papua': '/images/hero/hero-rajaampat.jpg',
};

const exploreExtraPlaces = [
  {
    id: 'ex-sum-5',
    name: 'Pantai Tanjung Tinggi Belitung',
    region: 'sumatra',
    isUMKM: false,
    isHiddenGem: true,
    isExample: true,
  },
  {
    id: 'ex-jaw-5',
    name: 'Kawah Ijen Banyuwangi',
    region: 'jawa',
    isUMKM: false,
    isHiddenGem: true,
    isExample: true,
  },
  {
    id: 'ex-kal-3',
    name: 'Kepulauan Derawan & Maratua',
    region: 'kalimantan',
    isUMKM: false,
    isHiddenGem: true,
    isExample: true,
  },
  {
    id: 'ex-kal-4',
    name: 'Pasar Terapung Lok Baintan',
    region: 'kalimantan',
    isUMKM: false,
    isHiddenGem: false,
    isExample: true,
  },
  {
    id: 'ex-kal-5',
    name: 'Desa Budaya Rumah Lamin Dayak',
    region: 'kalimantan',
    isUMKM: false,
    isHiddenGem: true,
    isExample: true,
  },
  {
    id: 'ex-sul-4',
    name: 'Taman Nasional Laut Bunaken',
    region: 'sulawesi',
    isUMKM: false,
    isHiddenGem: false,
    isExample: true,
  },
  {
    id: 'ex-sul-5',
    name: 'Kepulauan Wakatobi',
    region: 'sulawesi',
    isUMKM: false,
    isHiddenGem: true,
    isExample: true,
  },
  {
    id: 'ex-mp-5',
    name: 'Lembah Baliem Wamena Papua',
    region: 'maluku-papua',
    isUMKM: false,
    isHiddenGem: true,
    isExample: true,
  },
];

const exploreCatalogMap = new Map([
  ...mockDestinations.map((d) => [
    d.id,
    {
      id: d.id,
      name: d.name,
      region: d.region,
      image: exploreHdImages[d.id] || fallbackHeroByRegion[d.region],
      fallbackImage: fallbackHeroByRegion[d.region] || '/images/hero/hero-bromo.jpg',
      isUMKM: false,
      isHiddenGem: Boolean(d.isHiddenGem),
      isExample: false,
    },
  ]),
  ...mockLocalBusinesses.map((b) => [
    b.id,
    {
      id: b.id,
      name: b.name,
      region: b.region,
      image: exploreHdImages[b.id] || fallbackHeroByRegion[b.region],
      fallbackImage: fallbackHeroByRegion[b.region] || '/images/hero/hero-malioboro.jpg',
      isUMKM: Boolean(b.isUMKM),
      isHiddenGem: Boolean(b.isHiddenGem),
      isExample: false,
    },
  ]),
  ...exploreExtraPlaces.map((ex) => [
    ex.id,
    {
      ...ex,
      image: exploreHdImages[ex.id] || fallbackHeroByRegion[ex.region],
      fallbackImage: fallbackHeroByRegion[ex.region] || '/images/hero/hero-bromo.jpg',
    },
  ]),
]);

const exploreIslandDefs = [
  {
    id: 'sumatra',
    name: 'Sumatra',
    centroid: { x: 138, y: 155 },
    placeIds: ['dest-sum-1', 'lb-sum-1', 'lb-sum-2', 'dest-sum-2', 'ex-sum-5'],
    shapes: (
      <>
        <circle cx="50" cy="45" r="4" />
        <path d="M 57 54 L 82 70 L 116 105 L 154 146 L 190 198 L 207 240 L 198 248 L 176 228 L 146 192 L 122 162 L 98 124 L 72 86 L 54 62 Z" />
        <ellipse cx="218" cy="204" rx="7" ry="10" transform="rotate(-20 218 204)" />
        <circle cx="238" cy="212" r="5" />
        <circle cx="182" cy="128" r="4" />
        <circle cx="192" cy="134" r="3" />
      </>
    ),
  },
  {
    id: 'jawa',
    name: 'Jawa',
    centroid: { x: 280, y: 274 },
    placeIds: ['dest-jaw-1', 'lb-jaw-2', 'lb-jaw-1', 'dest-jaw-2', 'ex-jaw-5'],
    shapes: (
      <>
        <path d="M 213 260 L 245 256 L 285 264 L 320 272 L 341 284 L 336 293 L 302 288 L 274 285 L 240 276 L 214 268 Z" />
        <ellipse cx="322" cy="264" rx="11" ry="3.5" />
      </>
    ),
  },
  {
    id: 'bali-nusra',
    name: 'Bali & Nusa Tenggara',
    centroid: { x: 432, y: 300 },
    placeIds: ['dest-ntt-1', 'lb-bali-2', 'lb-bali-1', 'dest-bali-1', 'lb-ntb-2'],
    shapes: (
      <>
        <ellipse cx="357" cy="294" rx="10" ry="4.5" />
        <ellipse cx="378" cy="294" rx="8" ry="4" />
        <path d="M 392 291 L 417 293 L 415 300 L 390 298 Z" />
        <path d="M 426 292 L 468 294 L 465 301 L 424 299 Z" />
        <ellipse cx="426" cy="315" rx="12" ry="5" transform="rotate(8 426 315)" />
        <path d="M 476 318 L 514 302 L 518 310 L 480 325 Z" />
      </>
    ),
  },
  {
    id: 'kalimantan',
    name: 'Kalimantan',
    centroid: { x: 326, y: 148 },
    placeIds: ['dest-kal-1', 'lb-kal-1', 'ex-kal-3', 'ex-kal-4', 'ex-kal-5'],
    shapes: (
      <path d="M 265 152 L 286 122 L 322 110 L 356 80 L 378 94 L 370 126 L 385 150 L 366 176 L 342 208 L 310 212 L 278 198 L 263 174 Z" />
    ),
  },
  {
    id: 'sulawesi',
    name: 'Sulawesi',
    centroid: { x: 452, y: 176 },
    placeIds: ['dest-sul-1', 'lb-sul-1', 'lb-sul-2', 'ex-sul-4', 'ex-sul-5'],
    shapes: (
      <path d="M 426 144 L 464 128 L 502 122 L 504 131 L 468 139 L 444 155 L 456 168 L 488 164 L 486 174 L 452 180 L 456 202 L 478 232 L 466 236 L 444 208 L 434 214 L 424 240 L 414 236 L 418 202 L 416 174 Z" />
    ),
  },
  {
    id: 'maluku-papua',
    name: 'Maluku & Papua',
    centroid: { x: 648, y: 202 },
    placeIds: ['dest-pap-2', 'lb-mal-1', 'lb-pap-2', 'dest-mal-1', 'ex-mp-5'],
    shapes: (
      <>
        <path d="M 532 128 L 548 124 L 544 142 L 558 148 L 542 162 L 534 150 Z" />
        <ellipse cx="520" cy="193" rx="9" ry="5.5" />
        <path d="M 538 188 L 575 192 L 573 200 L 537 196 Z" />
        <circle cx="591" cy="156" r="4.5" />
        <circle cx="598" cy="162" r="3" />
        <path d="M 604 152 L 634 156 L 648 178 L 686 170 L 730 176 L 756 185 L 756 298 L 742 302 L 710 284 L 674 254 L 646 222 L 626 196 L 642 180 L 618 182 Z" />
      </>
    ),
  },
];

const exploreRegions = exploreIslandDefs.map((island) => {
  const places = island.placeIds.map((id) => exploreCatalogMap.get(id)).filter(Boolean);
  const umkmCount = mockLocalBusinesses.filter((b) => b.region === island.id).length;

  return {
    ...island,
    places: places.slice(0, 5),
    umkmCount,
  };
});

export default function LandingPage() {
  const navigate = useNavigate();

  const heroScopeRef = useRef(null);
  const headlineRef = useRef(null);
  const mapParallaxRef = useRef(null);
  const routeMaskRef = useRef(null);
  const scrollInviteRef = useRef(null);

  const caraKerjaScopeRef = useRef(null);
  const caraKerjaPinRef = useRef(null);
  const caraKerjaTlRef = useRef(null);
  const demoTypedRef = useRef(null);
  const aiStatusRef = useRef(null);
  const timelineLineRef = useRef(null);
  const miniRouteSegMaskRefs = useRef([]);

  const modeScopeRef = useRef(null);
  const modeTabIndicatorRef = useRef(null);
  const modeDescRef = useRef(null);
  const modeCostRef = useRef(null);
  const modeHoursRef = useRef(null);
  const modePlacesRef = useRef(null);
  const flipStateRef = useRef(null);
  const modeFlipTlRef = useRef(null);
  const modeCounterTweenRef = useRef(null);
  const modeLiveStatsRef = useRef({ cost: 0, hours: 0, places: 0 });
  const modeAnimateFnRef = useRef(null);

  const jelajahiScopeRef = useRef(null);
  const exploreMapViewportRef = useRef(null);
  const exploreTooltipRef = useRef(null);
  const hoveredIslandRef = useRef(null);
  const ctaScopeRef = useRef(null);
  const magneticBtnRef = useRef(null);

  const [destination, setDestination] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedIsland, setSelectedIsland] = useState('jawa');
  const [hoveredIsland, setHoveredIsland] = useState(null);
  const [activeMode, setActiveMode] = useState('budget');
  const [typedPlaceholder, setTypedPlaceholder] = useState('Ceritakan perjalananmu');

  // Animated typing placeholder cycling across Padang, Raja Ampat, Yogyakarta, Bali
  useEffect(() => {
    if (destination || inputFocused) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setTypedPlaceholder('Ceritakan perjalananmu (Padang, Raja Ampat, Yogyakarta, Bali)');
      return;
    }

    let regionIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timerId = null;

    const tick = () => {
      const currentRegion = typingRegions[regionIndex];

      if (!isDeleting) {
        charIndex += 1;
        setTypedPlaceholder(`Ceritakan perjalananmu ke ${currentRegion.slice(0, charIndex)}`);
        if (charIndex === currentRegion.length) {
          isDeleting = true;
          timerId = setTimeout(tick, 1400);
          return;
        }
        timerId = setTimeout(tick, 75);
      } else {
        charIndex -= 1;
        setTypedPlaceholder(
          charIndex > 0
            ? `Ceritakan perjalananmu ke ${currentRegion.slice(0, charIndex)}`
            : 'Ceritakan perjalananmu'
        );
        if (charIndex === 0) {
          isDeleting = false;
          regionIndex = (regionIndex + 1) % typingRegions.length;
          timerId = setTimeout(tick, 400);
          return;
        }
        timerId = setTimeout(tick, 45);
      }
    };

    timerId = setTimeout(tick, 500);
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [destination, inputFocused]);

  // GSAP Hero Animations with useGSAP scope & matchMedia for reduced-motion + desktop parallax
  useGSAP(
    () => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          isMobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop, isMobile, reduceMotion } = context.conditions;
          const scopeEl = heroScopeRef.current;

          if (reduceMotion) {
            gsap.set(['.hero-pin', '.hero-pin-label'], { opacity: 1, scale: 1 });
            if (routeMaskRef.current) {
              gsap.set(routeMaskRef.current, { drawSVG: '100%' });
            }
            if (scrollInviteRef.current) {
              gsap.set(scrollInviteRef.current, { opacity: 1, y: 0, scale: 1 });
            }
            return;
          }

          const tl = gsap.timeline();

          // 1. Word-by-word SplitText reveal on Hero Headline
          let split = null;
          if (headlineRef.current) {
            split = SplitText.create(headlineRef.current, {
              type: 'words',
              mask: 'words',
            });
            tl.from(
              split.words,
              {
                yPercent: 100,
                opacity: 0,
                stagger: 0.06,
                duration: 0.7,
                ease: 'power3.out',
              },
              0
            );
          }

          // Interactive scroll invitation button appears right after Hero Headline SplitText finishes
          if (scrollInviteRef.current) {
            tl.fromTo(
              scrollInviteRef.current,
              { opacity: 0, y: 16, scale: 0.94 },
              { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' },
              0.92
            );
            gsap.to('.hero-scroll-chevron', {
              y: 5,
              repeat: -1,
              yoyo: true,
              duration: 0.75,
              ease: 'power1.inOut',
              delay: 1.45,
            });
            gsap.to('.hero-scroll-ring', {
              scale: 1.4,
              opacity: 0,
              repeat: -1,
              duration: 1.5,
              ease: 'power2.out',
              delay: 1.45,
            });
          }

          // Mobile fallback: static 2D map without route animation or parallax
          if (isMobile) {
            gsap.set(['.hero-pin', '.hero-pin-label'], { opacity: 1, scale: 1 });
            if (routeMaskRef.current) {
              gsap.set(routeMaskRef.current, { drawSVG: '100%' });
            }
          } else {
            // 2. Curved dashed route drawing (DrawSVG on mask) & pins appearing sequentially
            if (routeMaskRef.current) {
              tl.fromTo(
                routeMaskRef.current,
                { drawSVG: '0%' },
                { drawSVG: '100%', duration: 2.1, ease: 'power2.inOut' },
                0.25
              );
            }

            tl.fromTo(
              '.hero-pin',
              { scale: 0, opacity: 0, transformOrigin: 'center center' },
              {
                scale: 1,
                opacity: 1,
                duration: 0.45,
                stagger: 0.24,
                ease: 'back.out(1.7)',
              },
              0.2
            );

            tl.fromTo(
              '.hero-pin-label',
              { opacity: 0, y: 6 },
              {
                opacity: 1,
                y: 0,
                duration: 0.35,
                stagger: 0.24,
                ease: 'power2.out',
              },
              0.35
            );
          }

          // 3. Desktop-only subtle cursor parallax on map (mobile stays static 2D without parallax)
          let handleMouseMove = null;
          let handleMouseLeave = null;

          if (isDesktop && scopeEl && mapParallaxRef.current) {
            const xTo = gsap.quickTo(mapParallaxRef.current, 'x', {
              duration: 0.6,
              ease: 'power3.out',
            });
            const yTo = gsap.quickTo(mapParallaxRef.current, 'y', {
              duration: 0.6,
              ease: 'power3.out',
            });

            handleMouseMove = (e) => {
              const rect = scopeEl.getBoundingClientRect();
              const normX = (e.clientX - rect.left) / rect.width - 0.5;
              const normY = (e.clientY - rect.top) / rect.height - 0.5;
              xTo(normX * 22);
              yTo(normY * 14);
            };

            handleMouseLeave = () => {
              xTo(0);
              yTo(0);
            };

            scopeEl.addEventListener('mousemove', handleMouseMove, { passive: true });
            scopeEl.addEventListener('mouseleave', handleMouseLeave);
          }

          return () => {
            if (split) split.revert();
            if (scopeEl && handleMouseMove) {
              scopeEl.removeEventListener('mousemove', handleMouseMove);
            }
            if (scopeEl && handleMouseLeave) {
              scopeEl.removeEventListener('mouseleave', handleMouseLeave);
            }
          };
        }
      );

      return () => mm.revert();
    },
    { scope: heroScopeRef }
  );

  // GSAP "Cara Kerja" Section: Pinned ScrollTrigger (desktop) + 3-step vertical scroll reveal (mobile)
  useGSAP(
    () => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          isMobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop, isMobile, reduceMotion } = context.conditions;

          if (reduceMotion) {
            if (demoTypedRef.current) demoTypedRef.current.textContent = caraKerjaPrompt;
            gsap.set(['.ck-mini-pin', '.ck-mini-label', '.ck-timeline-card', '.ck-total-est', '.ck-ai-done'], {
              opacity: 1,
              scale: 1,
              y: 0,
            });
            gsap.set('.ck-ai-loading', { opacity: 0 });
            if (timelineLineRef.current) gsap.set(timelineLineRef.current, { scaleY: 1, opacity: 1 });
            gsap.set('.ck-route-mask-seg', { drawSVG: '100%', opacity: 1 });
            return;
          }

          // Pulsing AI dots & blinking typing caret purely via GSAP transform + opacity
          gsap.to('.ck-ai-dot, .ck-ai-dot-mobile', {
            opacity: 0.25,
            scale: 0.7,
            stagger: { each: 0.16, repeat: -1, yoyo: true },
            duration: 0.45,
            ease: 'power1.inOut',
          });

          gsap.to('.ck-caret', {
            opacity: 0,
            repeat: -1,
            yoyo: true,
            duration: 0.5,
            ease: 'power1.inOut',
          });

          if (isMobile) {
            gsap.utils.toArray('.ck-mobile-step').forEach((step) => {
              gsap.from(step, {
                y: 26,
                opacity: 0,
                duration: 0.6,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: step,
                  start: 'top 86%',
                  once: true,
                },
              });
            });
            return;
          }

          if (isDesktop && caraKerjaPinRef.current) {
            if (demoTypedRef.current) demoTypedRef.current.textContent = '';
            gsap.set('.ck-stage-pill-1', { opacity: 1, scale: 1 });
            gsap.set(['.ck-stage-pill-2', '.ck-stage-pill-3'], { opacity: 0.4, scale: 0.96 });
            gsap.set('.ck-ai-loading', { opacity: 0, y: 10, scale: 0.96 });
            gsap.set('.ck-ai-done', { opacity: 0, y: 8, scale: 0.96 });
            gsap.set('.ck-mini-pin', { opacity: 0, scale: 0, transformOrigin: 'center center' });
            gsap.set('.ck-mini-label', { opacity: 0, y: 6 });
            gsap.set(timelineLineRef.current, { scaleY: 0, opacity: 0.3, transformOrigin: 'top center' });
            gsap.set('.ck-timeline-card', { opacity: 0, y: 20, scale: 0.97 });
            gsap.set('.ck-total-est', { opacity: 0, y: 12 });
            gsap.set('.ck-route-mask-seg', { drawSVG: '0%', opacity: 0 });

            // Play once when scrolled into view; never reverse/hide when scrolling back up
            const tl = gsap.timeline({ paused: true });
            caraKerjaTlRef.current = tl;

            ScrollTrigger.create({
              trigger: caraKerjaPinRef.current,
              start: 'top 70%',
              once: true,
              onEnter: () => {
                if (tl.progress() === 0 && !tl.isActive()) {
                  tl.play();
                }
              },
            });

            // Stage 1: Auto-type prompt in input (3.4s)
            tl.to(
              demoTypedRef.current,
              {
                text: { value: caraKerjaPrompt },
                ease: 'none',
                duration: 3.4,
              },
              0
            );

            // Stage 2: "AI sedang menyusun" + 3 pulsing dots enter before generating routes
            tl.to('.ck-stage-pill-1', { opacity: 0.45, scale: 0.96, duration: 0.3 }, 3.65)
              .to('.ck-stage-pill-2', { opacity: 1, scale: 1, duration: 0.3 }, 3.65)
              .to('.ck-ai-loading', { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' }, 3.75);

            // Alternating per-route reveal: list card first, clear beat, then map route + pin + label
            const lineScaleStops = [0.28, 0.64, 1];
            const routeStartTimes = [4.2, 5.85, 8.1];
            miniStops.forEach((stop, idx) => {
              const stepStart = routeStartTimes[idx];
              const mapTurnStart = stepStart + 0.8;
              const pinStart = idx === 0 ? mapTurnStart : mapTurnStart + 0.65;

              tl.to(
                timelineLineRef.current,
                {
                  scaleY: lineScaleStops[idx],
                  opacity: 1,
                  duration: 0.45,
                  ease: 'power2.out',
                },
                stepStart
              ).to(
                `.ck-timeline-card-${idx}`,
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.5,
                  ease: 'power3.out',
                },
                stepStart + 0.05
              );

              if (idx > 0) {
                const segMask = miniRouteSegMaskRefs.current[idx - 1];
                if (segMask) {
                  tl.set(segMask, { opacity: 1 }, mapTurnStart).to(
                    segMask,
                    {
                      drawSVG: '100%',
                      duration: 0.8,
                      ease: 'power2.inOut',
                    },
                    mapTurnStart
                  );
                }
              }

              tl.to(
                `.ck-mini-pin-${idx}`,
                {
                  opacity: 1,
                  scale: 1,
                  duration: 0.45,
                  ease: 'back.out(1.7)',
                },
                pinStart
              ).to(
                `.ck-mini-label-${idx}`,
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.35,
                  ease: 'power2.out',
                },
                pinStart + 0.1
              );
            });

            // Stage 3 Completion: switch pill + swap "AI sedang menyusun" to "Rute siap dijalankan"
            tl.to('.ck-stage-pill-2', { opacity: 0.45, scale: 0.96, duration: 0.3 }, 10.25)
              .to('.ck-stage-pill-3', { opacity: 1, scale: 1, duration: 0.3 }, 10.25)
              .to(
                '.ck-ai-loading',
                {
                  opacity: 0,
                  y: -6,
                  scale: 0.96,
                  duration: 0.35,
                  ease: 'power2.in',
                },
                10.25
              )
              .to(
                '.ck-ai-done',
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.5,
                  ease: 'back.out(1.6)',
                },
                10.4
              )
              .to(
                '.ck-total-est',
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  ease: 'power2.out',
                },
                10.4
              );
          }
        }
      );

      // Refresh ScrollTrigger once images and fonts settle so pin positions never shift
      const lenis = window.__lenis;
      const onLenisScroll = () => ScrollTrigger.update();
      if (lenis && typeof lenis.on === 'function') {
        lenis.on('scroll', onLenisScroll);
      }

      const handleRefresh = () => {
        ScrollTrigger.refresh();
      };

      const imgs = Array.from(document.querySelectorAll('img'));
      const pendingImgs = imgs.filter((img) => !img.complete);
      pendingImgs.forEach((img) => {
        img.addEventListener('load', handleRefresh);
        img.addEventListener('error', handleRefresh);
      });

      window.addEventListener('load', handleRefresh);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(handleRefresh).catch(() => {});
      }
      const rafId = requestAnimationFrame(handleRefresh);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('load', handleRefresh);
        pendingImgs.forEach((img) => {
          img.removeEventListener('load', handleRefresh);
          img.removeEventListener('error', handleRefresh);
        });
        if (lenis && typeof lenis.off === 'function') {
          lenis.off('scroll', onLenisScroll);
        }
        caraKerjaTlRef.current = null;
        mm.revert();
      };
    },
    { scope: caraKerjaScopeRef }
  );

  // GSAP "Mode Optimasi" Section: Mount matchMedia + scroll count-up (reverted only on unmount)
  useGSAP(
    () => {
      const formatCost = (val) => `Rp${Math.round(val).toLocaleString('id-ID')}`;
      const formatHours = (val) => `${Math.round(val)} jam`;
      const formatPlaces = (val) => `${Math.round(val)} tempat`;

      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          noMotionPref: '(prefers-reduced-motion: no-preference)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { reduceMotion } = context.conditions;
          const initialMode = optimizationModes[0];

          const applyImmediateStats = (modeObj) => {
            modeLiveStatsRef.current = {
              cost: modeObj.cost,
              hours: modeObj.hours,
              places: modeObj.places,
            };
            if (modeCostRef.current) modeCostRef.current.textContent = formatCost(modeObj.cost);
            if (modeHoursRef.current) modeHoursRef.current.textContent = formatHours(modeObj.hours);
            if (modePlacesRef.current) modePlacesRef.current.textContent = formatPlaces(modeObj.places);
          };

          if (reduceMotion) {
            if (modeTabIndicatorRef.current) gsap.set(modeTabIndicatorRef.current, { xPercent: 0 });
            applyImmediateStats(initialMode);
            modeAnimateFnRef.current = ({ modeIdx, currentMode }) => {
              if (modeTabIndicatorRef.current) {
                gsap.set(modeTabIndicatorRef.current, { xPercent: modeIdx * 100 });
              }
              applyImmediateStats(currentMode);
            };
            return;
          }

          const initProxy = { cost: 0, hours: 0, places: 1 };
          const renderInitStats = () => {
            modeLiveStatsRef.current = { ...initProxy };
            if (modeCostRef.current) modeCostRef.current.textContent = formatCost(initProxy.cost);
            if (modeHoursRef.current) modeHoursRef.current.textContent = formatHours(initProxy.hours);
            if (modePlacesRef.current) modePlacesRef.current.textContent = formatPlaces(initProxy.places);
          };

          renderInitStats();
          modeCounterTweenRef.current = gsap.to(initProxy, {
            cost: initialMode.cost,
            hours: initialMode.hours,
            places: initialMode.places,
            duration: 0.9,
            ease: 'power2.out',
            onUpdate: renderInitStats,
            scrollTrigger: {
              trigger: modeScopeRef.current,
              start: 'top 78%',
              once: true,
            },
          });

          modeAnimateFnRef.current = ({ modeIdx, currentMode, prevState }) => {
            if (modeTabIndicatorRef.current) {
              gsap.to(modeTabIndicatorRef.current, {
                xPercent: modeIdx * 100,
                duration: 0.38,
                ease: 'power3.out',
                overwrite: 'auto',
              });
            }

            if (prevState) {
              modeFlipTlRef.current = Flip.from(prevState, {
                duration: 0.52,
                ease: 'power3.out',
                stagger: 0.03,
                clearProps: 'transform',
              });
            }

            if (modeDescRef.current) {
              gsap.killTweensOf(modeDescRef.current);
              gsap.fromTo(
                modeDescRef.current,
                { opacity: 0, y: 6 },
                { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'transform' }
              );
            }

            if (modeCounterTweenRef.current) {
              modeCounterTweenRef.current.kill();
              modeCounterTweenRef.current = null;
            }

            const startStats =
              modeLiveStatsRef.current.cost > 0
                ? { ...modeLiveStatsRef.current }
                : { cost: 0, hours: 0, places: 1 };
            const proxy = { ...startStats };

            const renderStats = () => {
              modeLiveStatsRef.current = { ...proxy };
              if (modeCostRef.current) modeCostRef.current.textContent = formatCost(proxy.cost);
              if (modeHoursRef.current) modeHoursRef.current.textContent = formatHours(proxy.hours);
              if (modePlacesRef.current) modePlacesRef.current.textContent = formatPlaces(proxy.places);
            };

            modeCounterTweenRef.current = gsap.to(proxy, {
              cost: currentMode.cost,
              hours: currentMode.hours,
              places: currentMode.places,
              duration: 0.6,
              ease: 'power2.out',
              onUpdate: renderStats,
            });
          };
        }
      );

      return () => {
        modeAnimateFnRef.current = null;
        if (modeFlipTlRef.current) {
          modeFlipTlRef.current.kill();
          modeFlipTlRef.current = null;
        }
        if (modeCounterTweenRef.current) {
          modeCounterTweenRef.current.kill();
          modeCounterTweenRef.current = null;
        }
        mm.revert();
      };
    },
    { scope: modeScopeRef }
  );

  // Run mode switch animations without reverting in-flight Flip transforms between rapid clicks
  useGSAP(
    () => {
      const modeIdx = optimizationModes.findIndex((m) => m.id === activeMode);
      const currentMode = optimizationModes[modeIdx >= 0 ? modeIdx : 0];
      const formatCost = (val) => `Rp${Math.round(val).toLocaleString('id-ID')}`;
      const formatHours = (val) => `${Math.round(val)} jam`;
      const formatPlaces = (val) => `${Math.round(val)} tempat`;

      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        if (modeCostRef.current) modeCostRef.current.textContent = formatCost(currentMode.cost);
        if (modeHoursRef.current) modeHoursRef.current.textContent = formatHours(currentMode.hours);
        if (modePlacesRef.current) modePlacesRef.current.textContent = formatPlaces(currentMode.places);
        flipStateRef.current = null;
        modeLiveStatsRef.current = {
          cost: currentMode.cost,
          hours: currentMode.hours,
          places: currentMode.places,
        };
        return;
      }

      if (!flipStateRef.current) return;

      const prevState = flipStateRef.current;
      flipStateRef.current = null;

      // Kill prior Flip & reset cards to exact DOM grid resting positions before Flip.from reads destinations
      if (modeFlipTlRef.current) {
        modeFlipTlRef.current.kill();
        modeFlipTlRef.current = null;
      }
      Flip.killFlipsOf('.mode-flip-card');
      gsap.set('.mode-flip-card', { clearProps: 'transform' });

      if (modeAnimateFnRef.current) {
        modeAnimateFnRef.current({ modeIdx, currentMode, prevState });
      }
    },
    { scope: modeScopeRef, dependencies: [activeMode] }
  );

  const handleSelectMode = (nextId) => {
    if (nextId === activeMode) return;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      flipStateRef.current = Flip.getState('.mode-flip-card');
    }
    setActiveMode(nextId);
  };

  const handleWatchCaraKerja = () => {
    if (window.__lenis && typeof window.__lenis.reset === 'function') {
      window.__lenis.reset();
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.killTweensOf(window);
    document.documentElement.style.scrollBehavior = 'auto';
    gsap.to(window, {
      scrollTo: { y: '#cara-kerja', offsetY: 0, autoKill: false },
      duration: prefersReduced ? 0 : 0.8,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onInterrupt: () => {
        document.documentElement.style.scrollBehavior = '';
      },
      onComplete: () => {
        document.documentElement.style.scrollBehavior = '';
        const tl = caraKerjaTlRef.current;
        if (tl && !prefersReduced && tl.progress() === 0 && !tl.isActive()) {
          tl.play();
        }
      },
    });
  };

  const handleJumpToStage = (targetTime) => {
    const tl = caraKerjaTlRef.current;
    if (!tl) return;
    tl.pause();
    gsap.killTweensOf(tl);
    tl.tweenTo(targetTime, { duration: 0.65, ease: 'power2.out', overwrite: 'auto' });
  };

  const handleStart = (dest) => {
    const target = dest || destination;
    if (target && target.trim()) {
      navigate('/create', { state: { destination: target.trim() } });
    } else {
      navigate('/create');
    }
  };

  const activeExploreIsland =
    exploreRegions.find((r) => r.id === selectedIsland) || exploreRegions[1];
  const tooltipExploreIsland =
    exploreRegions.find((r) => r.id === hoveredIsland) || null;

  // GSAP "Jelajahi Indonesia": Interactive island glow + floating tooltip tracking
  useGSAP(
    () => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          noMotionPref: '(prefers-reduced-motion: no-preference)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { reduceMotion } = context.conditions;
          const viewport = exploreMapViewportRef.current;
          const tooltip = exploreTooltipRef.current;
          if (!viewport || !tooltip) return;

          gsap.set(tooltip, { opacity: 0, scale: 0.94, x: 0, y: 0 });

          const xTo = reduceMotion ? null : gsap.quickTo(tooltip, 'x', { duration: 0.25, ease: 'power3.out' });
          const yTo = reduceMotion ? null : gsap.quickTo(tooltip, 'y', { duration: 0.25, ease: 'power3.out' });

          const positionTooltipAtClient = (clientX, clientY, fallbackCentroid) => {
            const rect = viewport.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            let rawX;
            let rawY;
            if (clientX != null && clientY != null) {
              rawX = clientX - rect.left + 14;
              rawY = clientY - rect.top - 56;
            } else if (fallbackCentroid) {
              rawX = (fallbackCentroid.x / 800) * rect.width - 75;
              rawY = (fallbackCentroid.y / 380) * rect.height - 62;
            } else {
              return;
            }

            const clampedX = Math.max(12, Math.min(rect.width - 196, rawX));
            const clampedY = Math.max(12, Math.min(rect.height - 68, rawY));

            if (reduceMotion) {
              gsap.set(tooltip, { x: clampedX, y: clampedY });
            } else {
              xTo(clampedX);
              yTo(clampedY);
            }
          };

          const groups = gsap.utils.toArray('.explore-island-group');
          const cleanups = [];

          groups.forEach((group) => {
            const islandId = group.getAttribute('data-island-id');
            const islandMeta = exploreRegions.find((r) => r.id === islandId);
            const glow = group.querySelector('.explore-island-glow');

            const onEnter = (e) => {
              hoveredIslandRef.current = islandId;
              setHoveredIsland(islandId);
              positionTooltipAtClient(
                e && typeof e.clientX === 'number' ? e.clientX : null,
                e && typeof e.clientY === 'number' ? e.clientY : null,
                islandMeta?.centroid
              );
              gsap.to(tooltip, {
                opacity: 1,
                scale: 1,
                duration: reduceMotion ? 0 : 0.2,
                ease: 'power2.out',
                overwrite: 'auto',
              });
              if (glow) {
                gsap.to(glow, {
                  opacity: 1,
                  duration: reduceMotion ? 0 : 0.22,
                  ease: 'power2.out',
                  overwrite: 'auto',
                });
              }
            };

            const onMove = (e) => {
              positionTooltipAtClient(e.clientX, e.clientY, islandMeta?.centroid);
            };

            const onLeave = () => {
              if (hoveredIslandRef.current === islandId) hoveredIslandRef.current = null;
              setHoveredIsland((prev) => (prev === islandId ? null : prev));
              gsap.to(tooltip, {
                opacity: 0,
                scale: 0.94,
                duration: reduceMotion ? 0 : 0.16,
                ease: 'power2.in',
                overwrite: 'auto',
              });
              if (glow) {
                const isSelected = group.getAttribute('data-selected') === 'true';
                gsap.to(glow, {
                  opacity: isSelected ? 0.55 : 0,
                  duration: reduceMotion ? 0 : 0.22,
                  ease: 'power2.out',
                  overwrite: 'auto',
                });
              }
            };

            group.addEventListener('mouseenter', onEnter);
            group.addEventListener('mousemove', onMove);
            group.addEventListener('mouseleave', onLeave);
            group.addEventListener('focus', onEnter);
            group.addEventListener('blur', onLeave);

            cleanups.push(() => {
              group.removeEventListener('mouseenter', onEnter);
              group.removeEventListener('mousemove', onMove);
              group.removeEventListener('mouseleave', onLeave);
              group.removeEventListener('focus', onEnter);
              group.removeEventListener('blur', onLeave);
            });
          });

          return () => cleanups.forEach((fn) => fn());
        }
      );

      return () => mm.revert();
    },
    { scope: jelajahiScopeRef }
  );

  // GSAP "Jelajahi Indonesia": Selected island glow sync, 3-card asymmetric entrance, 3D tilt & hover zoom
  useGSAP(
    () => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          isMobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop, reduceMotion } = context.conditions;

          // Sync persistent selected glow vs hover state on SVG map
          gsap.utils.toArray('.explore-island-group').forEach((group) => {
            const islandId = group.getAttribute('data-island-id');
            const glow = group.querySelector('.explore-island-glow');
            if (!glow) return;
            const targetOpacity =
              islandId === hoveredIslandRef.current ? 1 : islandId === selectedIsland ? 0.55 : 0;
            gsap.to(glow, {
              opacity: targetOpacity,
              duration: reduceMotion ? 0 : 0.28,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          });

          const cards = gsap.utils.toArray('.explore-card');
          if (!reduceMotion && cards.length > 0) {
            gsap.killTweensOf(cards);
            gsap.fromTo(
              cards,
              { opacity: 0, y: 16, scale: 0.985 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                stagger: 0.08,
                duration: 0.45,
                ease: 'power3.out',
                clearProps: 'opacity',
              }
            );
          }

          if (!isDesktop) return;

          const cleanups = [];
          cards.forEach((card) => {
            const img = card.querySelector('.explore-card-img');
            gsap.set(card, { transformPerspective: 950, transformStyle: 'preserve-3d' });
            const rxTo = gsap.quickTo(card, 'rotateX', { duration: 0.35, ease: 'power3.out' });
            const ryTo = gsap.quickTo(card, 'rotateY', { duration: 0.35, ease: 'power3.out' });

            const onMove = (e) => {
              const r = card.getBoundingClientRect();
              if (!r.width || !r.height) return;
              const nx = (e.clientX - r.left) / r.width - 0.5;
              const ny = (e.clientY - r.top) / r.height - 0.5;
              rxTo(-ny * 8);
              ryTo(nx * 8);
            };

            const onEnter = () => {
              if (img) {
                gsap.to(img, { scale: 1.07, duration: 0.48, ease: 'power2.out', overwrite: 'auto' });
              }
            };

            const onLeave = () => {
              rxTo(0);
              ryTo(0);
              if (img) {
                gsap.to(img, { scale: 1, duration: 0.48, ease: 'power2.out', overwrite: 'auto' });
              }
            };

            card.addEventListener('mousemove', onMove);
            card.addEventListener('mouseenter', onEnter);
            card.addEventListener('mouseleave', onLeave);

            cleanups.push(() => {
              card.removeEventListener('mousemove', onMove);
              card.removeEventListener('mouseenter', onEnter);
              card.removeEventListener('mouseleave', onLeave);
            });
          });

          return () => cleanups.forEach((fn) => fn());
        }
      );

      return () => mm.revert();
    },
    { scope: jelajahiScopeRef, dependencies: [selectedIsland], revertOnUpdate: true }
  );

  // GSAP Closing CTA: Magnetic cursor pull on primary CTA button
  useGSAP(
    () => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const btn = magneticBtnRef.current;
        if (!btn) return;

        const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });

        const onMove = (e) => {
          const r = btn.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          xTo(Math.max(-18, Math.min(18, dx * 0.35)));
          yTo(Math.max(-14, Math.min(14, dy * 0.35)));
        };

        const onLeave = () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1, 0.45)',
            overwrite: 'auto',
          });
        };

        btn.addEventListener('mousemove', onMove);
        btn.addEventListener('mouseleave', onLeave);

        return () => {
          btn.removeEventListener('mousemove', onMove);
          btn.removeEventListener('mouseleave', onLeave);
        };
      });

      return () => mm.revert();
    },
    { scope: ctaScopeRef }
  );

  return (
    <div className="min-h-screen bg-[#071211] text-[#FBF5E9] font-sans selection:bg-[#F4A261] selection:text-[#07353E] overflow-x-clip">
      {/* ─── Navbar ───────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-[#0a1615]/85 backdrop-blur-md border-b border-white/[0.08]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <img
              src={logoFull}
              alt="TRIPIN"
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </button>

          {/* Dashboard Nav Action */}
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-extrabold bg-[#F4A261] hover:bg-[#ef944c] text-[#07353E] shadow-lg shadow-black/25 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* ─── Hero Section: One Idea, One Input + GSAP Stylized Nusantara Map ─── */}
      <section
        ref={heroScopeRef}
        className="relative min-h-[92vh] lg:min-h-screen flex flex-col justify-center pt-24 pb-16 md:pb-24 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #071211 0%, #0a1615 55%, #0b1c1b 100%)',
        }}
      >
        {/* Subtle dark teal atmospheric glow faded cleanly away from section edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 75% 46%, rgba(11,79,92,0.38) 0%, rgba(11,79,92,0.12) 42%, transparent 72%)',
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 0%, black 15%, black 80%, transparent 100%)',
            maskImage:
              'linear-gradient(180deg, transparent 0%, black 15%, black 80%, transparent 100%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
            {/* Left Side: Headline, Supporting Sentence (<=15 words), Single Input + CTA */}
            <div className="lg:col-span-6 space-y-6">
              <h1
                ref={headlineRef}
                className="font-display text-[2.5rem] sm:text-[3.25rem] xl:text-[3.9rem] font-extrabold text-[#FBF5E9] leading-[1.2] tracking-[-0.02em]"
              >
                Rencanakan perjalanan.{' '}
                <span className="text-[#F4A261]">Hidupkan ekonomi lokal.</span>
              </h1>

              <p className="text-[#FBF5E9]/80 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
                Rute AI cerdas ke seluruh Indonesia, hemat waktu sambil mendukung UMKM lokal.
              </p>

              {/* Single Input & Single Hero CTA */}
              <div className="pt-2 max-w-xl">
                <div
                  className={`p-2 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row items-center gap-2 border ${inputFocused
                    ? 'bg-[#0d2221] border-[#2EC4B6] shadow-[0_0_0_3px_rgba(46,196,182,0.28)]'
                    : 'bg-[#0d2221]/90 border-white/15 shadow-2xl shadow-black/40'
                    }`}
                >
                  <div className="w-full sm:flex-1 flex items-center gap-3 px-3.5 py-2 sm:py-0">
                    <Search size={19} className="text-[#2EC4B6] flex-shrink-0" />
                    <input
                      type="text"
                      aria-label="Ceritakan perjalananmu"
                      placeholder={typedPlaceholder}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      className="w-full bg-transparent text-[#FBF5E9] placeholder:text-[#FBF5E9]/55 text-sm sm:text-base font-medium outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleStart()}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#F4A261] hover:bg-[#ef944c] text-[#07353E] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    Susun Perjalanan
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Stylized Indonesian Archipelago SVG Map with GSAP DrawSVG & Pins */}
            <div className="lg:col-span-6 relative">
              <div ref={mapParallaxRef} className="w-full will-change-transform">
                <svg
                  viewBox="0 0 800 380"
                  role="img"
                  aria-label="Peta Kepulauan Indonesia dari Sabang sampai Merauke"
                  className="w-full h-auto drop-shadow-[0_12px_40px_rgba(11,79,92,0.45)]"
                >
                  <defs>
                    <linearGradient id="islandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#146E7A" />
                      <stop offset="100%" stopColor="#0B4F5C" />
                    </linearGradient>
                    <mask id="routeRevealMask">
                      <path
                        ref={routeMaskRef}
                        d={routePathD}
                        fill="none"
                        stroke="white"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                    </mask>
                  </defs>

                  {/* Stylized Indonesian Archipelago Silhouettes (Teal landmasses over dark sea) */}
                  <g
                    fill="url(#islandGrad)"
                    stroke="#2EC4B6"
                    strokeOpacity="0.45"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  >
                    {/* Sabang (Weh Island) */}
                    <circle cx="50" cy="45" r="4" />

                    {/* Sumatra */}
                    <path d="M 57 54 L 82 70 L 116 105 L 154 146 L 190 198 L 207 240 L 198 248 L 176 228 L 146 192 L 122 162 L 98 124 L 72 86 L 54 62 Z" />
                    {/* Bangka & Belitung */}
                    <ellipse cx="218" cy="204" rx="7" ry="10" transform="rotate(-20 218 204)" />
                    <circle cx="238" cy="212" r="5" />
                    {/* Riau Archipelago */}
                    <circle cx="182" cy="128" r="4" />
                    <circle cx="192" cy="134" r="3" />

                    {/* Jawa */}
                    <path d="M 213 260 L 245 256 L 285 264 L 320 272 L 341 284 L 336 293 L 302 288 L 274 285 L 240 276 L 214 268 Z" />
                    {/* Madura */}
                    <ellipse cx="322" cy="264" rx="11" ry="3.5" />

                    {/* Kalimantan */}
                    <path d="M 265 152 L 286 122 L 322 110 L 356 80 L 378 94 L 370 126 L 385 150 L 366 176 L 342 208 L 310 212 L 278 198 L 263 174 Z" />

                    {/* Bali & Nusa Tenggara */}
                    <ellipse cx="357" cy="294" rx="10" ry="4.5" />
                    <ellipse cx="378" cy="294" rx="8" ry="4" />
                    <path d="M 392 291 L 417 293 L 415 300 L 390 298 Z" />
                    <path d="M 426 292 L 468 294 L 465 301 L 424 299 Z" />
                    <ellipse cx="426" cy="315" rx="12" ry="5" transform="rotate(8 426 315)" />
                    <path d="M 476 318 L 514 302 L 518 310 L 480 325 Z" />

                    {/* Sulawesi */}
                    <path d="M 426 144 L 464 128 L 502 122 L 504 131 L 468 139 L 444 155 L 456 168 L 488 164 L 486 174 L 452 180 L 456 202 L 478 232 L 466 236 L 444 208 L 434 214 L 424 240 L 414 236 L 418 202 L 416 174 Z" />

                    {/* Maluku (Halmahera, Buru, Seram) */}
                    <path d="M 532 128 L 548 124 L 544 142 L 558 148 L 542 162 L 534 150 Z" />
                    <ellipse cx="520" cy="193" rx="9" ry="5.5" />
                    <path d="M 538 188 L 575 192 L 573 200 L 537 196 Z" />

                    {/* Papua & Raja Ampat */}
                    <circle cx="591" cy="156" r="4.5" />
                    <circle cx="598" cy="162" r="3" />
                    <path d="M 604 152 L 634 156 L 648 178 L 686 170 L 730 176 L 756 185 L 756 298 L 742 302 L 710 284 L 674 254 L 646 222 L 626 196 L 642 180 L 618 182 Z" />
                  </g>

                  {/* Curved Dashed Route Line revealed smoothly via GSAP DrawSVG */}
                  <path
                    d={routePathD}
                    fill="none"
                    stroke="#F4A261"
                    strokeWidth="2.4"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    mask="url(#routeRevealMask)"
                  />

                  {/* 8 Sequential Orange Pins */}
                  {mapPins.map((pin) => (
                    <g key={pin.name} transform={`translate(${pin.x}, ${pin.y})`}>
                      <g className="hero-pin">
                        <circle
                          cx="0"
                          cy="0"
                          r="9"
                          fill="#F4A261"
                          fillOpacity="0.22"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="4.5"
                          fill="#F4A261"
                          stroke="#FBF5E9"
                          strokeWidth="1.5"
                        />
                      </g>
                      <text
                        x={pin.labelDx}
                        y={pin.labelDy}
                        textAnchor={pin.align}
                        fill="#FBF5E9"
                        fontSize="11"
                        fontWeight="600"
                        className="hero-pin-label select-none pointer-events-none"
                        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
                      >
                        {pin.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Scroll Invitation (appears after Hero Headline SplitText completes) */}
        <div className="relative z-20 mt-8 md:mt-0 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 flex justify-center">
          <button
            ref={scrollInviteRef}
            type="button"
            onClick={handleWatchCaraKerja}
            className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0d2221]/90 hover:bg-[#0B4F5C] border border-[#2EC4B6]/45 hover:border-[#2EC4B6] text-[#FBF5E9] text-xs sm:text-sm font-semibold shadow-xl shadow-black/30 backdrop-blur-md transition-colors cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="hero-scroll-ring absolute inline-flex h-full w-full rounded-full bg-[#2EC4B6]" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2EC4B6]" />
            </span>
            <span>Lihat Cara Kerja</span>
            <ChevronDown size={16} className="hero-scroll-chevron text-[#F4A261]" />
          </button>
        </div>
      </section>

      {/* ─── Cara Kerja (Alternating List -> Map Reveal, Plays Once Cleanly) ─── */}
      <section
        id="cara-kerja"
        ref={caraKerjaScopeRef}
        style={{
          background: 'linear-gradient(180deg, #0b1c1b 0%, #0d2120 45%, #0b2628 82%, #0a282c 100%)',
        }}
      >
        {/* Desktop Showcase Stage (plays once cleanly on enter, stays visible on scroll up/down) */}
        <div
          ref={caraKerjaPinRef}
          className="hidden md:flex min-h-[85vh] py-20 lg:py-24 flex-col justify-center"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Minimal Header & Stage Labels */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-[#2EC4B6] block mb-1">
                  Cara Kerja
                </span>
                <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-[#FBF5E9] tracking-tight">
                  Dari Ide ke Rute Terukur
                </h2>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleJumpToStage(3.45)}
                  className="ck-stage-pill-1 px-3.5 py-1.5 rounded-full bg-[#0B4F5C] text-[#FBF5E9] border border-[#2EC4B6]/40 cursor-pointer hover:border-[#2EC4B6] transition-colors"
                >
                  1. Ceritakan
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToStage(7.85)}
                  className="ck-stage-pill-2 px-3.5 py-1.5 rounded-full bg-[#0B4F5C] text-[#FBF5E9] border border-[#2EC4B6]/40 cursor-pointer hover:border-[#2EC4B6] transition-colors"
                >
                  2. AI menyusun
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToStage(10.9)}
                  className="ck-stage-pill-3 px-3.5 py-1.5 rounded-full bg-[#0B4F5C] text-[#FBF5E9] border border-[#2EC4B6]/40 cursor-pointer hover:border-[#2EC4B6] transition-colors"
                >
                  3. Siap dijalankan
                </button>
              </div>
            </div>

            {/* Unified Interactive Showcase Workspace */}
            <div className="bg-gradient-to-b from-[#0b1f1e]/95 to-[#091919]/95 border border-[#2EC4B6]/15 rounded-3xl p-6 lg:p-8 shadow-2xl grid grid-cols-12 gap-6 items-stretch">
              {/* Left: Prompt Input, AI Status, Vertical Timeline */}
              <div className="col-span-7 flex flex-col gap-4">
                {/* 1. Ceritakan (Input Bar) */}
                <div className="bg-[#0d2221] border border-white/15 rounded-2xl px-4 py-3.5 flex items-start gap-3">
                  <Search size={18} className="text-[#2EC4B6] mt-0.5 flex-shrink-0" />
                  <div className="min-h-[44px] text-sm font-medium text-[#FBF5E9] leading-relaxed">
                    <span ref={demoTypedRef} />
                    <span className="ck-caret inline-block w-0.5 h-4 bg-[#F4A261] ml-0.5 align-middle" />
                  </div>
                </div>

                {/* 2 -> 3. AI status indicator: transitions from "AI sedang menyusun" to "Rute siap dijalankan" */}
                <div ref={aiStatusRef} className="inline-grid self-start">
                  <div className="ck-ai-loading col-start-1 row-start-1 bg-[#0B4F5C]/35 border border-[#2EC4B6]/30 rounded-xl px-4 py-2 inline-flex items-center gap-3">
                    <Sparkles size={15} className="text-[#2EC4B6]" />
                    <span className="text-xs font-semibold text-[#FBF5E9]">
                      AI sedang menyusun
                    </span>
                    <span className="flex items-center gap-1" aria-hidden="true">
                      <span className="ck-ai-dot w-1.5 h-1.5 rounded-full bg-[#F4A261]" />
                      <span className="ck-ai-dot w-1.5 h-1.5 rounded-full bg-[#F4A261]" />
                      <span className="ck-ai-dot w-1.5 h-1.5 rounded-full bg-[#F4A261]" />
                    </span>
                  </div>

                  <div className="ck-ai-done col-start-1 row-start-1 bg-[#0B4F5C]/70 border border-[#2EC4B6]/60 rounded-xl px-4 py-2 inline-flex items-center gap-2.5 shadow-lg shadow-[#2EC4B6]/10">
                    <CheckCircle2 size={15} className="text-[#2EC4B6]" />
                    <span className="text-xs font-bold text-[#FBF5E9]">
                      Rute siap dijalankan
                    </span>
                  </div>
                </div>

                {/* 3. Siap dijalankan (Progressive Vertical Timeline) */}
                <div className="relative pl-8 space-y-3 flex-1">
                  <div
                    ref={timelineLineRef}
                    className="absolute left-3 top-3 bottom-12 w-0.5 bg-gradient-to-b from-[#2EC4B6] to-[#F4A261] origin-top"
                  />

                  {miniStops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className={`ck-timeline-card ck-timeline-card-${idx} relative bg-[#0d2221] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3`}
                    >
                      <span className="absolute -left-[25px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#F4A261] border-2 border-[#0a1615]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2EC4B6]">
                          <Clock size={12} />
                          <span>{stop.time}</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#FBF5E9] truncate mt-0.5">
                          {stop.name}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#F4A261]/15 text-[#F4A261] border border-[#F4A261]/30 whitespace-nowrap flex-shrink-0">
                        {stop.estimate}
                      </span>
                    </div>
                  ))}

                  <div className="ck-total-est flex items-center justify-between pt-2 text-xs font-bold text-[#FBF5E9]/80">
                    <span>Total 2 Hari · Yogyakarta</span>
                    <span className="text-[#2EC4B6]">Estimasi Rp950.000</span>
                  </div>
                </div>
              </div>

              {/* Right: Mini Yogyakarta Route Map (SVG) */}
              <div className="col-span-5 bg-[#0d2221] border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-semibold text-[#FBF5E9]/75 mb-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#F4A261]" />
                    Yogyakarta
                  </span>
                  <span className="text-[11px] text-[#2EC4B6]">Peta Rute</span>
                </div>

                <svg
                  viewBox="0 0 360 300"
                  role="img"
                  aria-label="Peta mini rute perjalanan Yogyakarta"
                  className="w-full h-auto my-auto"
                >
                  <defs>
                    {miniRouteSegments.map((segD, idx) => (
                      <mask key={segD} id={`ckRouteMask-${idx}`}>
                        <path
                          ref={(el) => {
                            miniRouteSegMaskRefs.current[idx] = el;
                          }}
                          d={segD}
                          fill="none"
                          stroke="white"
                          strokeWidth="6"
                          strokeLinecap="round"
                          className="ck-route-mask-seg"
                        />
                      </mask>
                    ))}
                  </defs>

                  {/* Stylized Yogyakarta Terrain & River Contours */}
                  <g fill="none" stroke="#0B4F5C" strokeOpacity="0.65" strokeWidth="1.2">
                    <path d="M 20 80 Q 110 55 190 95 T 340 70" />
                    <path d="M 15 165 Q 130 140 210 175 T 345 150" />
                    <path d="M 30 245 Q 145 215 240 245 T 335 230" />
                    <path d="M 155 15 Q 175 110 160 185 T 175 285" stroke="#2EC4B6" strokeOpacity="0.22" strokeWidth="2" />
                  </g>

                  {/* Progressive Dashed Route Segments drawn via DrawSVG */}
                  {miniRouteSegments.map((segD, idx) => (
                    <path
                      key={segD}
                      d={segD}
                      fill="none"
                      stroke="#F4A261"
                      strokeWidth="2.5"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                      mask={`url(#ckRouteMask-${idx})`}
                    />
                  ))}

                  {/* Mini Pins */}
                  {miniStops.map((stop, idx) => (
                    <g key={stop.id} transform={`translate(${stop.x}, ${stop.y})`}>
                      <g className={`ck-mini-pin ck-mini-pin-${idx}`}>
                        <circle cx="0" cy="0" r="11" fill="#F4A261" fillOpacity="0.22" />
                        <circle
                          cx="0"
                          cy="0"
                          r="5"
                          fill="#F4A261"
                          stroke="#FBF5E9"
                          strokeWidth="1.5"
                        />
                      </g>
                      <text
                        x={stop.labelDx}
                        y={stop.labelDy}
                        textAnchor={stop.align}
                        fill="#FBF5E9"
                        fontSize="11"
                        fontWeight="600"
                        className={`ck-mini-label ck-mini-label-${idx} select-none pointer-events-none`}
                        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
                      >
                        {stop.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fallback: No Pin, 3 Vertical Steps Revealed on Scroll */}
        <div className="md:hidden py-16 px-4 max-w-xl mx-auto space-y-6">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[#2EC4B6] block mb-1">
              Cara Kerja
            </span>
            <h2 className="font-display text-2xl font-extrabold text-[#FBF5E9] tracking-tight">
              Dari Ide ke Rute Terukur
            </h2>
          </div>

          {/* Mobile Step 1: Ceritakan */}
          <div className="ck-mobile-step bg-[#0a1615] border border-white/10 rounded-2xl p-4 space-y-3">
            <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#0B4F5C] text-[#FBF5E9] border border-[#2EC4B6]/40">
              1. Ceritakan
            </span>
            <div className="bg-[#0d2221] border border-white/15 rounded-xl px-3.5 py-3 flex items-start gap-2.5 text-xs text-[#FBF5E9] leading-relaxed">
              <Search size={15} className="text-[#2EC4B6] mt-0.5 flex-shrink-0" />
              <span>{caraKerjaPrompt}</span>
            </div>
          </div>

          {/* Mobile Step 2: AI menyusun */}
          <div className="ck-mobile-step bg-[#0a1615] border border-white/10 rounded-2xl p-4 space-y-3">
            <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#0B4F5C] text-[#FBF5E9] border border-[#2EC4B6]/40">
              2. AI menyusun
            </span>
            <div className="bg-[#0B4F5C]/35 border border-[#2EC4B6]/30 rounded-xl px-3.5 py-2 inline-flex items-center gap-2.5">
              <Sparkles size={14} className="text-[#2EC4B6]" />
              <span className="text-xs font-semibold text-[#FBF5E9]">AI sedang menyusun</span>
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="ck-ai-dot-mobile w-1.5 h-1.5 rounded-full bg-[#F4A261]" />
                <span className="ck-ai-dot-mobile w-1.5 h-1.5 rounded-full bg-[#F4A261]" />
                <span className="ck-ai-dot-mobile w-1.5 h-1.5 rounded-full bg-[#F4A261]" />
              </span>
            </div>
          </div>

          {/* Mobile Step 3: Siap dijalankan */}
          <div className="ck-mobile-step bg-[#0a1615] border border-white/10 rounded-2xl p-4 space-y-4">
            <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-[#0B4F5C] text-[#FBF5E9] border border-[#2EC4B6]/40">
              3. Siap dijalankan
            </span>
            <div className="relative pl-6 space-y-2.5">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#2EC4B6] to-[#F4A261]" />
              {miniStops.map((stop) => (
                <div
                  key={stop.id}
                  className="relative bg-[#0d2221] border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <span className="absolute -left-[20px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#F4A261]" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-[#2EC4B6] block">{stop.time}</span>
                    <span className="text-xs font-bold text-[#FBF5E9] truncate block">{stop.name}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4A261]/15 text-[#F4A261] whitespace-nowrap">
                    {stop.estimate}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-[#0d2221] border border-white/10 rounded-xl p-3">
              <svg viewBox="0 0 360 300" role="img" aria-label="Peta rute Yogyakarta" className="w-full h-auto">
                <g fill="none" stroke="#0B4F5C" strokeOpacity="0.65" strokeWidth="1.2">
                  <path d="M 20 80 Q 110 55 190 95 T 340 70" />
                  <path d="M 15 165 Q 130 140 210 175 T 345 150" />
                  <path d="M 30 245 Q 145 215 240 245 T 335 230" />
                </g>
                <path
                  d={miniRoutePathD}
                  fill="none"
                  stroke="#F4A261"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />
                {miniStops.map((stop) => (
                  <g key={stop.id} transform={`translate(${stop.x}, ${stop.y})`}>
                    <circle cx="0" cy="0" r="5" fill="#F4A261" stroke="#FBF5E9" strokeWidth="1.5" />
                    <text
                      x={stop.labelDx}
                      y={stop.labelDy}
                      textAnchor={stop.align}
                      fill="#FBF5E9"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {stop.name}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="flex items-center justify-between pt-2 text-[11px] font-bold text-[#FBF5E9]/80">
                <span>Total 2 Hari · Yogyakarta</span>
                <span className="text-[#2EC4B6]">Estimasi Rp950.000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mode Optimasi (Deep Teal Gradient + Cream, GSAP Flip Reorder & Count-Up) ─── */}
      <section
        id="mode"
        ref={modeScopeRef}
        className="py-24 text-[#FBF5E9]"
        style={{
          background:
            'linear-gradient(180deg, #0a282c 0%, #0b3c46 22%, #0B4F5C 50%, #0b3740 78%, #0a1919 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-[#2EC4B6] block mb-2">
              Dengan TRIPIN, kamu dapat mencoba memilih gaya perjalanan
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FBF5E9] tracking-tight">
              Pilih Gaya Perjalananmu
            </h2>
          </div>

          <div className="bg-gradient-to-b from-[#0a2325]/95 to-[#081a1b]/95 border border-[#2EC4B6]/20 rounded-3xl p-5 sm:p-8 shadow-2xl">
            {/* 3 Tabs with Smooth Sliding Indicator */}
            <div className="relative grid grid-cols-3 p-1.5 rounded-2xl bg-[#071718] border border-white/10 mb-5">
              <div
                ref={modeTabIndicatorRef}
                className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-xl bg-[#2EC4B6] shadow-md"
              />
              {optimizationModes.map((mode) => {
                const isSelected = mode.id === activeMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleSelectMode(mode.id)}
                    className={`relative z-10 py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-colors duration-200 cursor-pointer ${
                      isSelected ? 'text-[#071718]' : 'text-[#FBF5E9]/80 hover:text-[#FBF5E9]'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Active Mode Name + Single Sentence Description Only */}
            {(() => {
              const currentModeObj =
                optimizationModes.find((m) => m.id === activeMode) || optimizationModes[0];
              return (
                <div ref={modeDescRef} className="text-center mb-6 px-2">
                  <p className="text-sm font-bold text-[#FBF5E9] mb-1">
                    {currentModeObj.label}
                  </p>
                  <p className="text-xs sm:text-sm text-[#FBF5E9]/80 leading-relaxed min-h-[2.5rem]">
                    {currentModeObj.description}
                  </p>
                </div>
              );
            })()}

            {/* 3 Count-Up Metrics */}
            <div className="grid grid-cols-3 gap-3 pb-6 mb-6 border-b border-white/10 text-center">
              <div className="bg-[#081b1c]/80 rounded-2xl p-3 sm:p-4 border border-white/[0.08]">
                <span className="text-[11px] text-[#FBF5E9]/65 block mb-1">Biaya estimasi</span>
                <span
                  ref={modeCostRef}
                  className="font-display text-base sm:text-xl font-extrabold text-[#F4A261]"
                >
                  Rp350.000
                </span>
              </div>
              <div className="bg-[#081b1c]/80 rounded-2xl p-3 sm:p-4 border border-white/[0.08]">
                <span className="text-[11px] text-[#FBF5E9]/65 block mb-1">Total waktu</span>
                <span
                  ref={modeHoursRef}
                  className="font-display text-base sm:text-xl font-extrabold text-[#FBF5E9]"
                >
                  7 jam
                </span>
              </div>
              <div className="bg-[#081b1c]/80 rounded-2xl p-3 sm:p-4 border border-white/[0.08]">
                <span className="text-[11px] text-[#FBF5E9]/65 block mb-1">Jumlah tempat</span>
                <span
                  ref={modePlacesRef}
                  className="font-display text-base sm:text-xl font-extrabold text-[#2EC4B6]"
                >
                  5 tempat
                </span>
              </div>
            </div>

            {/* 5 Reorderable Sample Yogyakarta Itinerary Cards (GSAP Flip) */}
            <div className="flex flex-col gap-3">
              {(optimizationModes.find((m) => m.id === activeMode) || optimizationModes[0]).order.map(
                (placeId, index) => {
                  const place = modeSamplePlaces[placeId];
                  return (
                    <div
                      key={place.id}
                      data-flip-id={place.id}
                      className="mode-flip-card bg-[#0b2324]/90 border border-white/10 rounded-2xl px-4 py-3.5 flex items-center gap-4"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#2EC4B6]/15 border border-[#2EC4B6]/40 text-[#2EC4B6] text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-[#FBF5E9]">
                        {place.name}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Jelajahi Indonesia (Interactive SVG Map + Asymmetric 3 Cards) ────── */}
      <section
        id="jelajahi"
        ref={jelajahiScopeRef}
        className="py-24"
        style={{
          background: 'linear-gradient(180deg, #0a1919 0%, #0b1d1c 50%, #0a1f21 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#2EC4B6] mb-2 block">
                Eksplorasi Nusantara
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FBF5E9] tracking-tight">
                Jelajahi Indonesia
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#FBF5E9]/70">
              Pulau aktif: <strong className="text-[#2EC4B6]">{activeExploreIsland.name}</strong> ·{' '}
              <span>{activeExploreIsland.umkmCount} UMKM (contoh)</span>
            </p>
          </div>

          {/* Interactive Indonesian SVG Map per Island */}
          <div
            ref={exploreMapViewportRef}
            className="relative bg-gradient-to-b from-[#0b1f1e]/95 to-[#091818]/95 border border-[#2EC4B6]/15 rounded-3xl p-4 sm:p-6 mb-8 shadow-2xl overflow-hidden"
          >
            {/* Floating Hover Tooltip */}
            <div
              ref={exploreTooltipRef}
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute top-0 left-0 z-20 px-3.5 py-2 rounded-xl bg-[#071617]/95 border border-[#2EC4B6]/50 shadow-xl backdrop-blur-md"
              style={{ opacity: 0 }}
            >
              {tooltipExploreIsland && (
                <>
                  <p className="text-xs font-extrabold text-[#FBF5E9] leading-tight">
                    {tooltipExploreIsland.name}
                  </p>
                  <p className="text-[11px] text-[#2EC4B6] mt-0.5">
                    {tooltipExploreIsland.umkmCount} UMKM (contoh) · Klik untuk lihat
                  </p>
                </>
              )}
            </div>

            <svg
              viewBox="0 0 800 380"
              role="img"
              aria-label="Peta interaktif Indonesia per pulau"
              className="w-full h-auto max-h-[340px]"
            >
              <defs>
                <linearGradient id="exploreIslandBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#146E7A" />
                  <stop offset="100%" stopColor="#0B4F5C" />
                </linearGradient>
                <filter id="exploreTurquoiseGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#2EC4B6" floodOpacity="0.65" />
                </filter>
              </defs>

              {exploreRegions.map((island) => {
                const isSelected = island.id === selectedIsland;
                return (
                  <g
                    key={island.id}
                    data-island-id={island.id}
                    data-selected={isSelected ? 'true' : 'false'}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${island.name} (${island.umkmCount} UMKM contoh)`}
                    onClick={() => setSelectedIsland(island.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedIsland(island.id);
                      }
                    }}
                    className="explore-island-group cursor-pointer focus:outline-none"
                  >
                    {/* Base Island Silhouette */}
                    <g
                      fill="url(#exploreIslandBaseGrad)"
                      stroke="#2EC4B6"
                      strokeOpacity={isSelected ? 0.85 : 0.42}
                      strokeWidth="1.25"
                      strokeLinejoin="round"
                    >
                      {island.shapes}
                    </g>

                    {/* Turquoise Glow Overlay driven by GSAP opacity */}
                    <g
                      className="explore-island-glow pointer-events-none"
                      opacity={isSelected ? 0.55 : 0}
                      fill="#2EC4B6"
                      fillOpacity="0.38"
                      stroke="#2EC4B6"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                      filter="url(#exploreTurquoiseGlow)"
                    >
                      {island.shapes}
                    </g>

                    {/* Expanded Transparent Hit Buffer for small island precision */}
                    <g
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth="14"
                      strokeLinejoin="round"
                      pointerEvents="all"
                    >
                      {island.shapes}
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 5 Asymmetric Wisata Cards: 1 Large + 4 Small (2x2), Title-Only, Non-Clickable */}
          {(() => {
            const renderExploreCard = (item, isLarge = false) => (
              <div
                key={item.id}
                className={`explore-card relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0d2221]/95 to-[#091717] border border-white/10 hover:border-[#2EC4B6]/45 transition-colors duration-300 shadow-xl flex flex-col justify-end select-none ${
                  isLarge
                    ? 'lg:col-span-6 min-h-[320px] lg:min-h-[460px]'
                    : 'min-h-[220px]'
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fallbackApplied) {
                      e.currentTarget.dataset.fallbackApplied = '1';
                      e.currentTarget.src = item.fallbackImage;
                    }
                  }}
                  className="explore-card-img absolute inset-0 w-full h-full object-cover will-change-transform"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(7,19,18,0.92) 0%, rgba(7,19,18,0.42) 48%, rgba(7,19,18,0.08) 100%)',
                  }}
                />

                <div className={`relative z-10 ${isLarge ? 'p-6 sm:p-8' : 'p-4 sm:p-5'}`}>
                  {(item.isUMKM || item.isHiddenGem || item.isExample) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {item.isUMKM && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#2EC4B6]/20 text-[#2EC4B6] border border-[#2EC4B6]/40 backdrop-blur-sm">
                          <Store size={10} />
                          UMKM
                        </span>
                      )}
                      {item.isHiddenGem && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F4A261]/20 text-[#F4A261] border border-[#F4A261]/40 backdrop-blur-sm">
                          <Sparkles size={10} />
                          Hidden Gem
                        </span>
                      )}
                      {item.isExample && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-[#FBF5E9]/85 border border-white/20 backdrop-blur-sm">
                          Contoh
                        </span>
                      )}
                    </div>
                  )}

                  <h3
                    className={`font-display font-extrabold text-[#FBF5E9] leading-snug ${
                      isLarge ? 'text-2xl sm:text-3xl' : 'text-sm sm:text-base'
                    }`}
                  >
                    {item.name}
                  </h3>
                </div>
              </div>
            );

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {activeExploreIsland.places[0] &&
                  renderExploreCard(activeExploreIsland.places[0], true)}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeExploreIsland.places
                    .slice(1, 5)
                    .map((item) => renderExploreCard(item, false))}
                </div>
              </div>
            );
          })()}

          {/* Single Action Link After List */}
          <div className="mt-8 flex justify-center sm:justify-start">
            <Link
              to="/discovery"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#2EC4B6] hover:text-[#F4A261] transition-colors"
            >
              Buka Local Discovery
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Closing CTA Section (Deep Teal Seamless Gradient, Magnetic Button) ── */}
      <section
        ref={ctaScopeRef}
        className="py-24 relative overflow-hidden text-center"
        style={{
          background:
            'linear-gradient(180deg, #0a1f21 0%, #0b414c 28%, #0B4F5C 58%, #09353c 82%, #071312 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 22% 45%, rgba(46,196,182,0.4) 0%, transparent 48%), radial-gradient(circle at 78% 55%, rgba(244,162,97,0.3) 0%, transparent 48%)',
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 0%, black 20%, black 80%, transparent 100%)',
            maskImage:
              'linear-gradient(180deg, transparent 0%, black 20%, black 80%, transparent 100%)',
          }}
        />

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 z-10">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#FBF5E9] tracking-tight mb-8 leading-tight">
            Mulai Susun Rute Indonesia Anda
          </h2>

          <div className="flex justify-center">
            <button
              ref={magneticBtnRef}
              onClick={() => navigate('/create')}
              className="px-9 py-4 rounded-2xl bg-[#F4A261] hover:bg-[#ef944c] text-[#07353E] font-extrabold text-base shadow-2xl shadow-black/30 inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer will-change-transform"
            >
              Susun Perjalanan
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Compact Footer (Logo, 3 Links, SDG 8 & SDG 12) ────────────────────── */}
      <footer
        className="py-10 text-xs text-[#FBF5E9]/60"
        style={{
          background: 'linear-gradient(180deg, #071312 0%, #050d0c 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <img
            src={logoFull}
            alt="TRIPIN"
            className="h-8 w-auto object-contain"
          />

          <p className="text-[#FBF5E9]/50 text-center md:text-right">
            Mendukung SDG 8 (Pertumbuhan Ekonomi Berkelanjutan) dan SDG 12 (Konsumsi & Produksi Bertanggung Jawab).
          </p>
        </div>
      </footer>
    </div>
  );
}
