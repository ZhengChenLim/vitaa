'use client';

import dynamic from 'next/dynamic';

// Load the real map component only on the client
const AirAqiMapInner = dynamic(() => import('./AirAqiMapInner'), { ssr: false });

export default AirAqiMapInner;
