import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Secure, Decentralized Cloud Storage</h1>
          <p>Store your files with blockchain technology for unmatched security and control</p>
          <Link to="/upload" className="cta-button">Get Started</Link>
        </div>
      </section>

      <section className="info-section">
        <div className="info-card">
          <h2>What is Cloud Storage?</h2>
          <p>
            Cloud storage is a model of computer data storage in which digital data is stored in logical pools. 
            The physical storage spans multiple servers and locations, and the physical environment is typically 
            owned and managed by a hosting company.
          </p>
          <p>
            Traditional cloud storage solutions rely on centralized servers controlled by a single entity, 
            creating potential vulnerabilities:
          </p>
          <ul>
            <li>Single point of failure risks</li>
            <li>Data privacy concerns</li>
            <li>Vendor lock-in</li>
            <li>Limited control over your own data</li>
          </ul>
        </div>

        <div className="info-card">
          <h2>What is Blockchain?</h2>
          <p>
            Blockchain is a distributed ledger technology that maintains a continuously growing list of records, 
            called blocks, which are linked and secured using cryptography. Each block contains a cryptographic 
            hash of the previous block, a timestamp, and transaction data.
          </p>
          <p>
            Key benefits of blockchain technology include:
          </p>
          <ul>
            <li>Decentralization - no single point of control</li>
            <li>Immutability - once data is written, it cannot be altered</li>
            <li>Transparency - all transactions are visible to network participants</li>
            <li>Security - cryptographic techniques protect data integrity</li>
          </ul>
        </div>

        <div className="info-card">
          <h2>Decentralized Storage Benefits</h2>
          <p>
            By combining cloud storage with blockchain technology, we create a superior storage solution:
          </p>
          <ul>
            <li>Complete ownership and control of your data</li>
            <li>Enhanced security through distributed storage</li>
            <li>Resistance to censorship and single points of failure</li>
            <li>Transparent, auditable file history</li>
            <li>Secure file sharing with cryptographic access control</li>
            <li>Reduced costs by eliminating intermediaries</li>
          </ul>
          <p>
            Our platform uses IPFS (InterPlanetary File System) to store your files across a distributed network, 
            while blockchain smart contracts manage access permissions and file metadata.
          </p>
        </div>
      </section>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature">
            <h3>Easy File Upload</h3>
            <p>Securely upload your files to the decentralized network with just a few clicks</p>
            <Link to="/upload">Try it now</Link>
          </div>
          <div className="feature">
            <h3>Quick Retrieval</h3>
            <p>Access your files from anywhere, anytime with our intuitive retrieval system</p>
            <Link to="/retrieve">Learn more</Link>
          </div>
          <div className="feature">
            <h3>Secure Sharing</h3>
            <p>Share files with others while maintaining complete control over access permissions</p>
            <Link to="/share">Explore sharing</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;