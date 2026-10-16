import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import HeritagePlace from '../models/content/HeritagePlace.js';
import HiddenPlace from '../models/content/HiddenPlace.js';
import CultureTradition from '../models/content/CultureTradition.js';
import ArtFolk from '../models/content/ArtFolk.js';
import FoodMarket from '../models/content/FoodMarket.js';

dns.setServers(['1.1.1.1', '8.8.8.8']);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Heritage Places:');
  const hplaces = await HeritagePlace.find({}).lean();
  for (const p of hplaces) {
    console.log(`  - [${p._id}] "${p.title}" | slug: "${p.slug}" | section: "${p.section}" | status: "${p.status}" | cityId: "${p.cityId}"`);
  }

  console.log('\nHidden Places:');
  const hidden = await HiddenPlace.find({}).lean();
  for (const p of hidden) {
    console.log(`  - [${p._id}] "${p.title}" | slug: "${p.slug}" | section: "${p.section}" | status: "${p.status}" | cityId: "${p.cityId}"`);
  }

  console.log('\nCulture & Traditions:');
  const cult = await CultureTradition.find({}).lean();
  for (const p of cult) {
    console.log(`  - [${p._id}] "${p.title}" | slug: "${p.slug}" | section: "${p.section}" | status: "${p.status}" | cityId: "${p.cityId}"`);
  }

  console.log('\nArts & Folk:');
  const arts = await ArtFolk.find({}).lean();
  for (const p of arts) {
    console.log(`  - [${p._id}] "${p.title}" | slug: "${p.slug}" | section: "${p.section}" | status: "${p.status}" | cityId: "${p.cityId}"`);
  }

  console.log('\nFood & Markets:');
  const food = await FoodMarket.find({}).lean();
  for (const p of food) {
    console.log(`  - [${p._id}] "${p.title}" | slug: "${p.slug}" | section: "${p.section}" | status: "${p.status}" | cityId: "${p.cityId}"`);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
