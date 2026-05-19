const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Template = require('./models/Template');
const Page = require('./models/Page');
const Settings = require('./models/Settings');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany();
    await Template.deleteMany();
    await Page.deleteMany();
    await Settings.deleteMany();
    console.log('Cleared existing data');

    // Users
    const admin = await User.create({ name: 'Admin User', email: 'admin@cms.com', password: 'admin123', role: 'admin' });
    const editor = await User.create({ name: 'Editor User', email: 'editor@cms.com', password: 'editor123', role: 'editor' });
    const author = await User.create({ name: 'Author User', email: 'author@cms.com', password: 'author123', role: 'author' });
    console.log('✅ Users created');

    // Templates - create one by one to avoid insertMany casting issues
    await Template.create({ name: 'Blank Page', description: 'Start from scratch', category: 'blank', blocks: [], createdBy: admin._id });

    await Template.create({
      name: 'Landing Page',
      description: 'Hero + Features + CTA',
      category: 'landing',
      thumbnail: 'https://via.placeholder.com/400x250/3b82f6/white?text=Landing',
      createdBy: admin._id,
      blocks: [
        { id: 'b1', type: 'heading', content: { text: 'Welcome to Our Platform', level: 1 }, styles: { textAlign: 'center' }, order: 0 },
        { id: 'b2', type: 'paragraph', content: { text: 'The best solution for your needs.' }, styles: { textAlign: 'center' }, order: 1 },
        { id: 'b3', type: 'button', content: { text: 'Get Started', href: '#', variant: 'primary' }, styles: {}, order: 2 },
        { id: 'b4', type: 'divider', content: {}, styles: {}, order: 3 },
        { id: 'b5', type: 'columns', content: { columns: [{ text: '🚀 Fast' }, { text: '🔒 Secure' }, { text: '📊 Analytics' }] }, styles: {}, order: 4 },
      ],
    });

    await Template.create({
      name: 'Blog Post',
      description: 'Article with header and content',
      category: 'blog',
      thumbnail: 'https://via.placeholder.com/400x250/8b5cf6/white?text=Blog',
      createdBy: admin._id,
      blocks: [
        { id: 'b1', type: 'heading', content: { text: 'Your Blog Post Title', level: 1 }, styles: {}, order: 0 },
        { id: 'b2', type: 'paragraph', content: { text: 'Write your introduction here...' }, styles: {}, order: 1 },
        { id: 'b3', type: 'image', content: { src: '', alt: 'Featured image' }, styles: {}, order: 2 },
        { id: 'b4', type: 'paragraph', content: { text: 'Continue your content here...' }, styles: {}, order: 3 },
      ],
    });

    await Template.create({
      name: 'Call to Action',
      description: 'Simple CTA page',
      category: 'landing',
      createdBy: admin._id,
      blocks: [
        { id: 'b1', type: 'cta', content: { title: 'Ready to get started?', subtitle: 'Join thousands of users today.', buttonText: 'Get Started', href: '#' }, styles: {}, order: 0 },
      ],
    });

    console.log('✅ Templates created');

    // Pages
    await Page.create({
      title: 'Home Page', slug: 'home', status: 'published', isHomePage: true,
      author: admin._id, lastEditedBy: admin._id, publishedAt: new Date(), viewCount: 142,
      blocks: [
        { id: 'b1', type: 'heading', content: { text: 'Welcome to Our CMS', level: 1 }, styles: { textAlign: 'center' }, order: 0 },
        { id: 'b2', type: 'paragraph', content: { text: 'Manage your content effortlessly.' }, styles: { textAlign: 'center' }, order: 1 },
        { id: 'b3', type: 'button', content: { text: 'Learn More', href: '/about', variant: 'primary' }, styles: {}, order: 2 },
      ],
      seo: { title: 'Home | My CMS', description: 'Welcome to our CMS powered website.' },
      tags: ['home', 'featured'],
    });

    await Page.create({
      title: 'About Us', slug: 'about', status: 'published',
      author: editor._id, lastEditedBy: editor._id, approvedBy: admin._id, publishedAt: new Date(), viewCount: 89,
      blocks: [
        { id: 'b1', type: 'heading', content: { text: 'About Our Company', level: 1 }, styles: {}, order: 0 },
        { id: 'b2', type: 'paragraph', content: { text: 'We are a team of passionate developers.' }, styles: {}, order: 1 },
      ],
      seo: { title: 'About Us | My CMS', description: 'Learn about our team.' },
      tags: ['about'],
    });

    await Page.create({
      title: 'Contact Page', slug: 'contact', status: 'draft',
      author: author._id, lastEditedBy: author._id,
      blocks: [
        { id: 'b1', type: 'heading', content: { text: 'Contact Us', level: 1 }, styles: {}, order: 0 },
        { id: 'b2', type: 'paragraph', content: { text: 'Get in touch with us.' }, styles: {}, order: 1 },
      ],
      tags: ['contact'],
    });

    await Page.create({
      title: 'New Feature Announcement', slug: 'new-feature', status: 'pending',
      author: author._id, lastEditedBy: author._id,
      blocks: [
        { id: 'b1', type: 'heading', content: { text: 'Exciting New Features', level: 1 }, styles: {}, order: 0 },
        { id: 'b2', type: 'paragraph', content: { text: 'We are thrilled to announce...' }, styles: {}, order: 1 },
      ],
      tags: ['announcement', 'features'],
    });

    console.log('✅ Pages created');

    await Settings.create({
      siteName: 'My CMS Platform',
      siteDescription: 'A powerful content management system',
      siteUrl: 'http://localhost:3000',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      approvalRequired: true,
      postsPerPage: 10,
      updatedBy: admin._id,
    });
    console.log('✅ Settings created');

    console.log('\n🎉 Seeding complete!');
    console.log('📧 Admin:  admin@cms.com  / admin123');
    console.log('📧 Editor: editor@cms.com / editor123');
    console.log('📧 Author: author@cms.com / author123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seed();