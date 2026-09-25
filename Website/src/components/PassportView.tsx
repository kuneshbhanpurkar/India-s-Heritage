import React, { useState } from 'react';
import { HeritageSite, UserProfile } from '../types';

interface PassportViewProps {
  savedSites?: HeritageSite[];
  onToggleFavorite?: (siteId: string) => void;
  onViewMonograph?: (site: HeritageSite) => void;
  onExploreMore?: () => void;
  onNavigateToMap?: () => void;
  onOpenStateDistrictModal?: () => void;
  selectedStateCode?: string;
  selectedDistrictName?: string;
  user: UserProfile;
  onUpdateUser?: (name: string) => Promise<void>;
}

type BadgeCategory =
  | 'All'
  | 'Monuments & Palaces'
  | 'Historic Cities'
  | 'States & Kingdoms'
  | 'Special Epigraphy & Guilds';

interface BadgeItem {
  id: string;
  name: string;
  category: 'Monuments & Palaces' | 'Historic Cities' | 'States & Kingdoms' | 'Special Epigraphy & Guilds';
  categoryBadge: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string;
}

const BADGES_COLLECTION: BadgeItem[] = [
  {
    id: 'badge-1',
    name: 'Rajwada Palace Explorer',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'Aug 2024',
    location: 'Indore, Madhya Pradesh',
    description: '7-Tier Maratha Architecture & Holkar Bastion',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTXpfn59IjqTbcKoavGWpm4jAcqGF0TV7D8XTxGMppE-s9N_TI1KFoHiwhVp7vPfmmOIJjK9KD5Iuo_qHKHnI9ZmMTSjGIKlB91gDnnoTFe9qJ3-kwH6OeehQkhLhWGlZFwOMFLqjuvJnfcmbid4pQUThIEHIKzFxiwO3xQEq2Xe0xD5J9SHrChh5yZgl1PyP4avMATZ5bBnu5ql2mSjE2e0vzMRopzioxGIGAysz0RcGEdq-CBfrCY-7Xgo2lbpgXAA',
  },
  {
    id: 'badge-2',
    name: 'Lal Bagh Sovereign Seal',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'Aug 2024',
    location: 'Indore, Madhya Pradesh',
    description: 'Holkar Royal Estate & Versailles Classical Gates',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAfShC3Emc-jgjg3AhZaGwN0wmIRN7kkpLrlVLOU_Dky3KRdFQj49gkCItXucdTfSW2UCw_cHtVtw-zCKn2z3um2prELATThFuTLTCKwyifm8pHMrnTN3z8YcSwbqRmUndDXsCj4xZWH7i0zXuJ7ebk9FNGlRVnrXhloofxq0QfCF75JMF9wHSo_3K3ue3USMbSruTp9sIJQufx86tP3cDY8lPRBrdn4tX18B94RSmszFpJcGOmOIu1ulsSKIwWyU9s_A',
  },
  {
    id: 'badge-3',
    name: 'Sarafa Nocturnal Guild',
    category: 'Special Epigraphy & Guilds',
    categoryBadge: 'Living Guild Seal',
    date: 'Jul 2024',
    location: 'Indore, Madhya Pradesh',
    description: 'Night Culinary Traditions & Bullion Market Heritage',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAjUf-QSq3Y4SDGEod597_x6p17UkgfYNX8khriAwI-yUfTjK-Sy42ZQebWloRnnWveldpszY6I8sEMTbc1eweMp75L3OMPwWIgIdgafxWXByLrxruScx-CBexi3dxLV2_N6SLXzZ6NJjPrghaxCGFnfL7QeeEnIvRxXEvTyZfGvDnObeF5g_3A36bfzIiByTTabeitQDLXkixPhbcMv_VQdb7U_A0k3RbS60yl56l62sKThgbkaT68dbmmJ8Py9aqMZA',
  },
  {
    id: 'badge-4',
    name: 'Indore City Master',
    category: 'Historic Cities',
    categoryBadge: 'City Sovereign Seal',
    date: 'Jul 2024',
    location: 'City Accreditation',
    description: 'Historic Malwa Capital & Saraswati River Enclave',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDyaxR2fsXtYvY_Dq6sOVpf3xazAHf3ODFlb19s1fyZhO9ccKKQXAEjaMRVS-bkL4IPer2tFximEpFOY-_vdoS6i8IlmzMUMrlpMQJmuzCYnLu86qsNgchRDNOJdWpmCoiCP15P2EYHkEolzk-Hn3S3dE4w3p4BhDeVvvqxyJI6hqFWv_vJbD0hKo0IRlhmT0Df_9Lh_bzcm0qfBTCPCajtAg-RgUQiVeA0Sm_3pMyBSLTztZdTJPxuDEcgGO_VVntCEA',
  },
  {
    id: 'badge-5',
    name: 'Madhya Pradesh Heartland',
    category: 'States & Kingdoms',
    categoryBadge: 'State Kingdom Pin',
    date: 'Jun 2024',
    location: 'State Explorer',
    description: '5 Regional Heritage Hubs Explored in the Heart of India',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCR3wNe0EeW8g03PJfhmpduMxMfZs8ufhMHJuNNw4GbcGgjp1I67TZPra_gHTXJ91CIoN0OgHES0hJjznU1iRISqoDBw4dMDKg7InK7ZE-LjHHDH5kMlQV8WWldnlurj-FGwJPOd_5X1kcS5Mi80KNgjV7ea1mfTiGZuT2Ptg5cVG7gOJ7tNElLALvNI2ddLcUvKVtiRPq5nyYojWNlbTnvpg5ft3UtpqcDKKusVYhlgK3LFOwNG03oGZrO6zE5Q-jrlQ',
  },
  {
    id: 'badge-6',
    name: 'Khajuraho Chandela Honor',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'May 2024',
    location: 'Chhatarpur, Madhya Pradesh',
    description: 'Nagara Temple Architecture & UNESCO Sandstone Marvel',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXUszpKSwx8nozA33a79yfEo37sYkgQ9Em3oKsT52c3mjhY29ItTJUpK1Iu_TmhtLpp6A2_zBvOgwAPUZtagiqzoCxejxcvbtjksxSA4ju_FL5rk5MBqxeaHX8gfCKhitVEZeNPgocLbv3NKQGvR-HbJ4oB9FIvyy3488knaMoQsK8lSEsLFAzx0Dtiab54Tdr4gOKWhELXm_HKuDgOcYjPYry0eUJGKE9LYCZshtlgL7IJ12smFKXyn1PenGyvux9mA',
  },
  {
    id: 'badge-7',
    name: 'Bhimbetka Caves Seal',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'Apr 2024',
    location: 'Raisen, Madhya Pradesh',
    description: 'Paleolithic Rock Art Dating back 30,000 BP',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAt_ferTSQn1wTfdQI25XUvv0i9C-6MDsYhfwc-aa68Y_6yxQvcTJOHpD46PmBYFSL-NNRE-5ELip3uuYq8BcV9Wys56H2yrEkMuZDdMhW48WfbZ5n_cJDlr3_l-abrcqmGIZtZ5AYgQoFwobYFOcKbeTRjCbxqdxzZHwpu-4Xyx1XSPSoZp6_iWYcnWBp31dPnPYG6SNs31HSbv-kQ0F_U2yyRsqfyXcMcfyjyjL0PLbfKXYnDws_dV_-DEzLtC3ntg',
  },
  {
    id: 'badge-8',
    name: 'Mandu Citadel of Joy',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'Mar 2024',
    location: 'Dhar, Madhya Pradesh',
    description: 'Jahaz Mahal & Medieval Afghan Splendor on the Plateau',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCO9zhZWZNmoFZqV5Uzw_xN7y6QLFmjnKCbl_ZcNJ-KYT8bwhaKh4IMOkYFDAMtoLCwj8WXKKOxOdzvPjgbLJ8uFvyK6EE3NVVzmFiZCPDKJ4bCqVUjmEmLd6HMT78rB3DqNd7SG7LNZjhrYa8kJzW0-Mgt6T0WEgfWltEn82Z0uVNcT5U2heU8IvXPmpfiB190KUUJ2h5kjHoAOHcC1Y-CDq0syNTmWWz0088ha2vnrfxj8onrwyk95XlmwBWwVKEfmA',
  },
  {
    id: 'badge-9',
    name: 'Ujjain Mahakal Pilgrim',
    category: 'Historic Cities',
    categoryBadge: 'City Sovereign Seal',
    date: 'Feb 2024',
    location: 'Ujjain, Madhya Pradesh',
    description: 'Shipra River Ghats & Ancient Jantar Mantar Astronomy',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCnapaR1LYE8YyaKyKM574e4KBdPFS3xQHU9qlRYNHmkJBa9Opr5x_A6uvmIAx6lDsaXEwqx8LENyGXuC_afIMWnUH0Scg9eTi2kWV11kHkzlCv2DFyzlZuHi6LsKNYpPppr7TXtIIZvl9xmcLqq60e6dGSu3ZyJMrnuF-rS8epP0QFtla5-6SojBxXDsv7vzlp8gJYyv1xRHoYLgHc80JCtGMAe5DciZzm2Q5eJVrDan32axYqA59xoeBzNjkPAs4ixQ',
  },
  {
    id: 'badge-10',
    name: 'Amer Fort Sentinel',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'Dec 2023',
    location: 'Jaipur, Rajasthan',
    description: 'Sheesh Mahal Glassworks & Hill Fort of Rajasthan',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDt8oyRAs5ZEJE9VMgIHKCS1T2b0f5E8ZcW51UqMqBj-14vuluyt4WqsPEsguLaZtbJFrncfKLg0Bm6dvRcE83VhPYuem4-Pe1xyS5y64l3H2l_miCIqhvlEYYnvy63EIIjGBDMs3aJWP8-lSfEAMauHT2_d8iM20UlIN7iyCJTdXU9gDxVdC-eZSv-89AcuPHOddtGTdz68GvXB3fNo-C9bbHfTwOBVauhB19cyCaqsrWR_asxGsy23ntzTUB8kLqXgw',
  },
  {
    id: 'badge-11',
    name: 'Jaipur Pink Citadel',
    category: 'Historic Cities',
    categoryBadge: 'City Sovereign Seal',
    date: 'Nov 2023',
    location: 'Jaipur, Rajasthan',
    description: 'Walled City UNESCO World Heritage Site',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCA8Hwufmybq_0-mYsAPrInrbMQAp0aB4nwed3pvWe4joal9_vG01lT7wXtC04wl_I912uviUbIavQ1ws8JU6fPOm00iI9Hjf8HhnGPNZ_l2vSkx9t12ZHJ6PAaQSLANA-xfU9xfq8FHmSC90aXzPtjV1-cm5BojVxhmITTQoreaM3rY6SlzWH_drRTI7Oj-Yp2kJacpBggj6fGfR5ncJN79pZHOxtbxJ4BCW5QoxlQjMzmrxWtK0qf5E0lujjpz0djXQ',
  },
  {
    id: 'badge-12',
    name: 'Rajasthan Royal Pass',
    category: 'States & Kingdoms',
    categoryBadge: 'State Kingdom Pin',
    date: 'Oct 2023',
    location: 'State Explorer',
    description: 'Thar Desert Historical Forts & Haveli Corridors',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAMP71MR_5VaTeAvyvKEgXY74GG5zJjUEH7cknULj_BA3PPYPRyTuezyiOTA-JrUEfeuPYIZHzd0zN-PeMXPtaNqWcyUH1T_-mBkPnxPLu1ju87oUCmOcrZMbALbPtsFwKjA6tO9JXfY8iBLknEU4JiAMyKT-oo1KI7XEtTgSL5GXtVn1EnCWnO3F6XaMScvwkCd_Vn_Ra5acQWgVNQBYuy9oypWWQVySdQ8YS2EmRFtv5LfhoDMkzte7LBDg_st9z93A',
  },
  {
    id: 'badge-13',
    name: 'Konark Sun Charioteer',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'Sep 2023',
    location: 'Puri, Odisha',
    description: 'Kalinga Sun Temple & 24 Carved Stone Wheels',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTXpfn59IjqTbcKoavGWpm4jAcqGF0TV7D8XTxGMppE-s9N_TI1KFoHiwhVp7vPfmmOIJjK9KD5Iuo_qHKHnI9ZmMTSjGIKlB91gDnnoTFe9qJ3-kwH6OeehQkhLhWGlZFwOMFLqjuvJnfcmbid4pQUThIEHIKzFxiwO3xQEq2Xe0xD5J9SHrChh5yZgl1PyP4avMATZ5bBnu5ql2mSjE2e0vzMRopzioxGIGAysz0RcGEdq-CBfrCY-7Xgo2lbpgXAA',
  },
  {
    id: 'badge-14',
    name: 'Hampi Vijayanagara Sovereign',
    category: 'Historic Cities',
    categoryBadge: 'City Sovereign Seal',
    date: 'Aug 2023',
    location: 'Vijayanagara, Karnataka',
    description: 'Tungabhadra River Monoliths & Virupaksha Sanctum',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDyaxR2fsXtYvY_Dq6sOVpf3xazAHf3ODFlb19s1fyZhO9ccKKQXAEjaMRVS-bkL4IPer2tFximEpFOY-_vdoS6i8IlmzMUMrlpMQJmuzCYnLu86qsNgchRDNOJdWpmCoiCP15P2EYHkEolzk-Hn3S3dE4w3p4BhDeVvvqxyJI6hqFWv_vJbD0hKo0IRlhmT0Df_9Lh_bzcm0qfBTCPCajtAg-RgUQiVeA0Sm_3pMyBSLTztZdTJPxuDEcgGO_VVntCEA',
  },
  {
    id: 'badge-15',
    name: 'Ajanta & Ellora Rock Carver',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'Jul 2023',
    location: 'Chhatrapati Sambhajinagar, Maharashtra',
    description: 'Kailasa Monolithic Temple & Ancient Frescoes',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAfShC3Emc-jgjg3AhZaGwN0wmIRN7kkpLrlVLOU_Dky3KRdFQj49gkCItXucdTfSW2UCw_cHtVtw-zCKn2z3um2prELATThFuTLTCKwyifm8pHMrnTN3z8YcSwbqRmUndDXsCj4xZWH7i0zXuJ7ebk9FNGlRVnrXhloofxq0QfCF75JMF9wHSo_3K3ue3USMbSruTp9sIJQufx86tP3cDY8lPRBrdn4tX18B94RSmszFpJcGOmOIu1ulsSKIwWyU9s_A',
  },
  {
    id: 'badge-16',
    name: 'Nalanda Mahavihara Scholar',
    category: 'Special Epigraphy & Guilds',
    categoryBadge: 'Epigraphy Accredit',
    date: 'Jun 2023',
    location: 'Nalanda, Bihar',
    description: 'Ancient International Monastic University & Seal Stampings',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAjUf-QSq3Y4SDGEod597_x6p17UkgfYNX8khriAwI-yUfTjK-Sy42ZQebWloRnnWveldpszY6I8sEMTbc1eweMp75L3OMPwWIgIdgafxWXByLrxruScx-CBexi3dxLV2_N6SLXzZ6NJjPrghaxCGFnfL7QeeEnIvRxXEvTyZfGvDnObeF5g_3A36bfzIiByTTabeitQDLXkixPhbcMv_VQdb7U_A0k3RbS60yl56l62sKThgbkaT68dbmmJ8Py9aqMZA',
  },
  {
    id: 'badge-17',
    name: 'Mahabalipuram Shore Watcher',
    category: 'Monuments & Palaces',
    categoryBadge: 'Monument Honor',
    date: 'May 2023',
    location: 'Chengalpattu, Tamil Nadu',
    description: '7th-century coastal Pallava granite monolithic carvings',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXUszpKSwx8nozA33a79yfEo37sYkgQ9Em3oKsT52c3mjhY29ItTJUpK1Iu_TmhtLpp6A2_zBvOgwAPUZtagiqzoCxejxcvbtjksxSA4ju_FL5rk5MBqxeaHX8gfCKhitVEZeNPgocLbv3NKQGvR-HbJ4oB9FIvyy3488knaMoQsK8lSEsLFAzx0Dtiab54Tdr4gOKWhELXm_HKuDgOcYjPYry0eUJGKE9LYCZshtlgL7IJ12smFKXyn1PenGyvux9mA',
  },
  {
    id: 'badge-18',
    name: 'Bishnupur Terracotta Guild',
    category: 'Special Epigraphy & Guilds',
    categoryBadge: 'Living Guild Seal',
    date: 'Apr 2023',
    location: 'Bankura, West Bengal',
    description: 'Malla Dynasty Curved Terracotta Brick Sanctuaries',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCR3wNe0EeW8g03PJfhmpduMxMfZs8ufhMHJuNNw4GbcGgjp1I67TZPra_gHTXJ91CIoN0OgHES0hJjznU1iRISqoDBw4dMDKg7InK7ZE-LjHHDH5kMlQV8WWldnlurj-FGwJPOd_5X1kcS5Mi80KNgjV7ea1mfTiGZuT2Ptg5cVG7gOJ7tNElLALvNI2ddLcUvKVtiRPq5nyYojWNlbTnvpg5ft3UtpqcDKKusVYhlgK3LFOwNG03oGZrO6zE5Q-jrlQ',
  },
];

export const PassportView: React.FC<PassportViewProps> = ({
  onOpenStateDistrictModal,
  selectedStateCode = 'MP',
  selectedDistrictName = 'Indore',
  user,
  onUpdateUser,
}) => {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('All');
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);

  // User Profile State (persisted in session)
  const [userName, setUserName] = useState<string>(user.name);

  const categories: { label: string; count: number; value: BadgeCategory }[] = [
    { label: 'All Badges', count: 18, value: 'All' },
    { label: 'Monuments & Palaces', count: 8, value: 'Monuments & Palaces' },
    { label: 'Historic Cities', count: 4, value: 'Historic Cities' },
    { label: 'States & Kingdoms', count: 3, value: 'States & Kingdoms' },
    { label: 'Special Epigraphy & Guilds', count: 3, value: 'Special Epigraphy & Guilds' },
  ];

  const filteredBadges =
    activeCategory === 'All'
      ? BADGES_COLLECTION
      : BADGES_COLLECTION.filter((b) => b.category === activeCategory);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast('Heritage Passport link copied to clipboard!');
      setTimeout(() => setShareToast(null), 3000);
    } else {
      setShareToast('Passport ready for sharing!');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pb-24 select-none animate-fadeIn">
      {/* Container: Full fluid responsive edge-to-edge layout */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-8 md:py-12 flex flex-col gap-12 sm:gap-16">
        
        {/* Top Section: User Profile Editorial Card */}
        <section className="w-full bg-white rounded-2xl shadow-sm border border-[#e2e2e2] p-6 sm:p-8 md:p-12 relative overflow-hidden">
          {/* Decorative faint watermark background graphic */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5 pointer-events-none text-[#a14009]">
            <span className="material-symbols-outlined text-[320px]">shield</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 lg:items-start justify-between relative z-10">
            {/* Left: Explorer Bio and Identification */}
            <div className="flex flex-col sm:flex-row gap-6 sm:items-start max-w-3xl">
              {/* Avatar Frame with Crest */}
              <div className="relative shrink-0 self-start">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#e8e8e8] overflow-hidden shadow-sm flex items-center justify-center ring-4 ring-white">
                  <img
                    className="w-full h-full object-cover"
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqQqx-DFpVX1--EvasXuyKHxVZZqKySML61I42H_zP2LPLeeE2XsXgVHII-6hDAkj5gFbQbQ_fS5WY84_4OXakzVLa1fGtoeLygppfz9tW7un86bUX4-dhluYVpmvTpu71_IdX5iOdGo3lc9GkPS3gjIrDXtf_FqKLmMvsptS0xSP7k15tiZEm3y8rgtsOM4Q1wYkiC8tWIGLhf5qe07mewS3Ng4BbruTdi-0bUusriStcZKEHN-eM"
                  />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-[#a14009] text-white rounded-full p-1.5 shadow-md flex items-center justify-center"
                  title="ASI Verified Connoisseur"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
              </div>

              {/* Explorer Text Details */}
              <div className="flex flex-col gap-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#a14009] bg-[#f3f3f3] px-3 py-1 rounded">
                    {user.email} • Verified Explorer
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium text-[#444748] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#735c00]">military_tech</span>
                    Level 4 Connoisseur
                  </span>
                </div>

                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1c1c] tracking-tight leading-none mb-1.5">
                    {userName}
                  </h1>
                  
                  {/* Location Pill with Click to Change State/District */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenStateDistrictModal}
                      title="Click to change active State & District"
                      className="group inline-flex items-center gap-1.5 text-sm sm:text-base text-[#444748] font-medium hover:text-[#a14009] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#a14009]">location_on</span>
                      <span>
                        {selectedDistrictName}, {selectedStateCode}, India
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#a14009] bg-[#a14009]/10 px-2 py-0.5 rounded-full group-hover:bg-[#a14009]/20 transition-colors ml-1">
                        Change
                      </span>
                    </button>
                  </div>
                </div>

                <p className="text-sm sm:text-[15px] text-[#444748] leading-relaxed max-w-xl">
                  {user.email}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#444748] pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">event</span>
                    Account location: {user.state}, {user.district}
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="font-semibold text-[#a14009] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
                    Top 5% Regional Contributor
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-3">
                  <button
                    onClick={handleShare}
                    className="bg-[#a14009] text-white hover:bg-[#853407] transition-all px-5 sm:px-6 py-2.5 rounded text-xs uppercase tracking-wider font-semibold shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    <span>Share Heritage Passport</span>
                  </button>

                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="bg-[#f3f3f3] text-[#a14009] hover:bg-[#eeeeee] transition-colors px-5 sm:px-6 py-2.5 rounded text-xs uppercase tracking-wider font-semibold shadow-xs flex items-center gap-2 cursor-pointer active:scale-98"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>Edit Profile</span>
                  </button>

                  {onOpenStateDistrictModal && (
                    <button
                      onClick={onOpenStateDistrictModal}
                      className="bg-white border border-[#e2e2e2] text-[#444748] hover:text-[#a14009] hover:border-[#a14009] transition-colors px-4 py-2.5 rounded text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">map</span>
                      <span>Change Region</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Field Explorer Metrics Strip */}
            <div className="w-full lg:w-80 bg-[#f3f3f3] rounded-xl p-5 sm:p-6 flex flex-col gap-4 shadow-xs self-stretch justify-between border border-[#e8e8e8]">
              <div className="flex items-center justify-between pb-3 border-b border-[#c4c7c7]/30">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#444748]">
                  Field Record
                </span>
                <span className="material-symbols-outlined text-[#a14009] text-[20px]">
                  auto_stories
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="font-serif text-[28px] sm:text-[32px] font-bold text-[#1a1c1c] leading-tight">
                    18
                  </span>
                  <span className="text-xs text-[#444748] font-medium">Badges Earned</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-[28px] sm:text-[32px] font-bold text-[#a14009] leading-tight">
                    12
                  </span>
                  <span className="text-xs text-[#444748] font-medium">Centrally Protected</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-[28px] sm:text-[32px] font-bold text-[#1a1c1c] leading-tight">
                    4
                  </span>
                  <span className="text-xs text-[#444748] font-medium">Heritage Cities</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-[28px] sm:text-[32px] font-bold text-[#1a1c1c] leading-tight">
                    2
                  </span>
                  <span className="text-xs text-[#444748] font-medium">States Explored</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#c4c7c7]/30 flex items-center justify-between text-xs">
                <span className="text-[#444748]">Epigraph Discoveries:</span>
                <span className="font-semibold text-[#a14009]">3 Logged</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Body: Badges & Honors Collection */}
        <section className="flex flex-col gap-8 w-full">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#a14009] mb-1.5 block">
                Official Accreditations
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1a1c1c] font-bold">
                Heritage Badges &amp; Honors
              </h2>
              <p className="text-sm text-[#444748] mt-1">
                Official exploration honors authenticated by Archaeological Survey of India &amp; State Tourism councils.
              </p>
            </div>

            {/* Metric Counter Pill */}
            <div className="bg-[#e8e8e8] text-[#1a1c1c] px-4 py-2 rounded-full text-xs font-semibold self-start md:self-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a14009]"></span>
              <span>
                {filteredBadges.length} of 18 Active Badges Displayed
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" id="badge-filters">
            {categories.map((tab) => {
              const isActive = activeCategory === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveCategory(tab.value)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                    isActive
                      ? 'bg-[#a14009] text-white'
                      : 'bg-white text-[#444748] hover:text-[#1a1c1c] hover:bg-[#f3f3f3]'
                  }`}
                  type="button"
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Badges Grid: Uniform Ribbon Medal Graphic with Individual Locational Dignity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="bg-white rounded-xl p-6 shadow-xs hover:shadow-md transition-all border border-[#e2e2e2] flex flex-col items-center text-center justify-between relative group cursor-pointer hover:-translate-y-1"
              >
                <span className="absolute top-4 right-4 bg-[#eeeeee] text-[#444748] text-[10px] font-semibold px-2 py-0.5 rounded">
                  {badge.date}
                </span>

                <div className="pt-2 flex flex-col items-center w-full">
                  <img
                    alt={badge.name}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 mx-auto object-contain drop-shadow-xs mb-3 group-hover:scale-105 transition-transform"
                    src={badge.imageUrl}
                  />

                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#a14009] block mb-1">
                    {badge.categoryBadge}
                  </span>

                  <h3 className="font-serif text-[19px] leading-snug text-[#1a1c1c] font-semibold mb-1">
                    {badge.name}
                  </h3>

                  <p className="text-xs font-semibold text-[#444748] mb-2">{badge.location}</p>

                  <p className="text-xs text-[#747878] leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 w-full border-t border-[#eeeeee] flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#a14009]">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Verified Visit • GPS Validated</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1a1c1c] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* Badge Inspect Modal */}
      {selectedBadge && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 text-center relative shadow-2xl border border-[#e2e2e2]">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-[#747878] hover:text-[#1a1c1c] p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <img
              src={selectedBadge.imageUrl}
              alt={selectedBadge.name}
              referrerPolicy="no-referrer"
              className="w-32 h-32 mx-auto object-contain drop-shadow-md mb-4"
            />

            <span className="text-xs uppercase tracking-widest font-bold text-[#a14009] block mb-1">
              {selectedBadge.categoryBadge}
            </span>

            <h3 className="font-serif text-2xl font-bold text-[#1a1c1c] mb-1">
              {selectedBadge.name}
            </h3>

            <p className="text-xs font-semibold text-[#444748] mb-3">
              {selectedBadge.location} • {selectedBadge.date}
            </p>

            <p className="text-sm text-[#444748] leading-relaxed mb-6">
              {selectedBadge.description}
            </p>

            <div className="p-3 bg-[#f9f9f9] rounded-xl border border-[#e8e8e8] text-xs text-[#555] mb-6 text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#888]">Authentication Authority:</span>
                <span className="font-semibold text-[#1a1c1c]">ASI Bhopal &amp; State Board</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Validation Protocol:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span> GPS Geofence Check-in
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Verification ID:</span>
                <span className="font-mono text-[#555]">ASI-HP-2024-009402</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-xl bg-[#a14009] text-white font-semibold text-xs uppercase tracking-wider hover:bg-[#853407] transition cursor-pointer"
            >
              Close Accreditation
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl border border-[#e2e2e2]">
            <div className="flex items-center justify-between pb-4 border-b border-[#e8e8e8] mb-5">
              <h3 className="font-serif text-xl font-bold text-[#1a1c1c]">
                Edit Explorer Profile
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#747878] hover:text-[#1a1c1c] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase mb-1">
                  Explorer Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#e2e2e2] bg-[#f9f9f9] text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#a14009]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase mb-1">
                  Bio &amp; Research Focus
                </label>
                <textarea
                  rows={3}
                  value={`${user.state}, ${user.district}`}
                  onChange={() => undefined}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#e2e2e2] bg-[#f9f9f9] text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#a14009]/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] uppercase mb-1">
                  Active Base Location
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e2e2e2] bg-[#f3f3f3] text-[#555]">
                    {selectedDistrictName}, {selectedStateCode}, India
                  </div>
                  {onOpenStateDistrictModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditProfileOpen(false);
                        onOpenStateDistrictModal();
                      }}
                      className="px-3 py-2 text-xs font-semibold bg-[#a14009]/10 text-[#a14009] rounded-lg hover:bg-[#a14009]/20 transition cursor-pointer"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#e8e8e8]">
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#555] hover:bg-[#f3f3f3] rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateUser?.(userName).then(() => {
                    setIsEditProfileOpen(false);
                    setShareToast('Profile updated successfully!');
                    setTimeout(() => setShareToast(null), 3000);
                  });
                }}
                className="px-5 py-2 text-xs font-semibold bg-[#a14009] text-white hover:bg-[#853407] rounded-lg shadow-xs transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
