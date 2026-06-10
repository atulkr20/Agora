import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  Shield, 
  Sliders, 
  Check, 
  ArrowRight,
  Cpu
} from 'lucide-react'
import './App.css'

function App() {
  const containerRef = useRef(null)
  
  // Apple-style scroll zoom transforms
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const scale = useTransform(scrollYProgress, [0, 0.45], [0.95, 1.08])
  const rotateX = useTransform(scrollYProgress, [0, 0.45], [8, 0])
  const translateY = useTransform(scrollYProgress, [0, 0.45], [0, -10])

  // Ticking price state
  const [btcPrice, setBtcPrice] = useState(96240.50)
  const [usdBalance, setUsdBalance] = useState(356123.27)
  const [orderAmount, setOrderAmount] = useState('0.15')
  const [tradeType, setTradeType] = useState('buy')
  const [orderTab, setOrderTab] = useState('limit')

  // Newsletter state
  const [emailInput, setEmailInput] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  // Staking reward state
  const [stakeAmount, setStakeAmount] = useState(25000)
  const [selectedAsset, setSelectedAsset] = useState('SOL')
  const [apy, setApy] = useState(12.8)

  const handleAssetChange = (asset) => {
    setSelectedAsset(asset)
    if (asset === 'SOL') setApy(12.8)
    else if (asset === 'ETH') setApy(8.4)
    else setApy(4.2)
  }

  // simulated live trade history
  const [tradeLogs, setTradeLogs] = useState([
    { id: 1, type: 'BUY', price: '96,242.00', qty: '0.450 BTC', status: 'FILLED', time: '11:51:12' },
    { id: 2, type: 'SELL', price: '96,240.50', qty: '1.240 BTC', status: 'FILLED', time: '11:51:09' },
    { id: 3, type: 'BUY', price: '96,238.10', qty: '0.085 BTC', status: 'FILLED', time: '11:51:01' }
  ])

  // Simulated ticks
  useEffect(() => {
    const timer = setInterval(() => {
      setBtcPrice(prev => {
        const delta = (Math.random() - 0.5) * 35
        return prev + delta
      })

      if (Math.random() > 0.45) {
        const type = Math.random() > 0.5 ? 'BUY' : 'SELL'
        const qtyVal = (Math.random() * 1.2 + 0.05).toFixed(3)
        const priceVal = btcPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
        const newLog = {
          id: Date.now(),
          type,
          price: priceVal,
          qty: `${qtyVal} BTC`,
          status: 'FILLED',
          time: new Date().toLocaleTimeString()
        }
        setTradeLogs(prev => [newLog, ...prev.slice(0, 4)])
      }
    }, 1800)

    return () => clearInterval(timer)
  }, [btcPrice])

  const handleFaucetMint = () => {
    setUsdBalance(prev => prev + 10000)
  }

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (emailInput.trim()) {
      setSubscribed(true)
      setEmailInput('')
    }
  }

  const handlePlaceOrder = () => {
    const cost = Number(orderAmount) * btcPrice
    if (tradeType === 'buy') {
      if (cost > usdBalance) {
        alert('Insufficient USD balance in sandbox wallet!')
        return
      }
      setUsdBalance(prev => prev - cost)
      alert(`Order Filled: Bought ${orderAmount} BTC at $${btcPrice.toLocaleString(undefined, {maximumFractionDigits:2})}!`)
    } else {
      setUsdBalance(prev => prev + cost)
      alert(`Order Filled: Sold ${orderAmount} BTC at $${btcPrice.toLocaleString(undefined, {maximumFractionDigits:2})}!`)
    }
  }

  // Candlesticks rendering configuration
  const candles = [
    { open: 120, close: 100, wickHigh: 130, wickLow: 95, volume: 40, isGreen: false },
    { open: 100, close: 85, wickHigh: 110, wickLow: 80, volume: 55, isGreen: false },
    { open: 85, close: 105, wickHigh: 115, wickLow: 80, volume: 30, isGreen: true },
    { open: 105, close: 90, wickHigh: 120, wickLow: 85, volume: 45, isGreen: false },
    { open: 90, close: 115, wickHigh: 125, wickLow: 85, volume: 65, isGreen: true },
    { open: 115, close: 130, wickHigh: 140, wickLow: 110, volume: 70, isGreen: true },
    { open: 130, close: 110, wickHigh: 135, wickLow: 105, volume: 50, isGreen: false },
    { open: 110, close: 125, wickHigh: 130, wickLow: 100, volume: 40, isGreen: true },
    { open: 125, close: 145, wickHigh: 150, wickLow: 120, volume: 80, isGreen: true },
    { open: 145, close: 135, wickHigh: 155, wickLow: 130, volume: 60, isGreen: false },
    { open: 135, close: 155, wickHigh: 160, wickLow: 130, volume: 90, isGreen: true }
  ]

  // Stagger animation definitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90, damping: 16 } }
  }

  return (
    <div className="landing-viewport-light" ref={containerRef}>
      
      {/* Background Grid Pattern */}
      <div className="bg-grid-overlay"></div>

      {/* Main Navbar */}
      <nav className="navbar-light">
        <div className="nav-logo">
          <svg viewBox="0 0 24 24" className="logo-svg" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>Agora</span>
        </div>
        <div className="nav-links">
          <span className="nav-link active">Markets</span>
          <span className="nav-link">Trade</span>
          <span className="nav-link">Staking</span>
          <span className="nav-link">Governance</span>
          <span className="nav-link">Docs</span>
        </div>
        <button className="btn-get-started" onClick={() => alert('Launching Agora Advanced Terminal...')}>
          Connect Wallet
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        
        <motion.div 
          className="hero-header-block-cool"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="new-badge" variants={itemVariants}>
            <span className="badge-dark">V2.0</span>
            <span className="badge-label">Sub-millisecond execution engine</span>
          </motion.div>
          
          <motion.h1 className="serif-title" variants={itemVariants}>
            The Professional Grade<br />Decentralized Exchange.
          </motion.h1>
          
          <motion.p className="hero-desc" variants={itemVariants}>
            Match limit orders directly through our liquidity consensus protocol. Speed of centralized execution,<br />
            with absolute non-custodial custody.
          </motion.p>

          <motion.div className="hero-actions" variants={itemVariants}>
            <button className="btn-create-acc" onClick={() => alert('Connecting wallet...')}>Launch App</button>
            <button className="btn-exp-demo" onClick={handleFaucetMint}>Faucet Mint $10k</button>
          </motion.div>
        </motion.div>

        {/* Desktop Terminal Showcase Container with Apple-style scroll transform */}
        <div className="hero-terminal-wrapper">
          <motion.div 
            className="desktop-terminal-preview"
            style={{ scale, rotateX, y: translateY }}
          >
            {/* Terminal Window Header Bar */}
            <div className="terminal-window-header">
              <div className="window-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="terminal-title">Agora Advanced Console v2.0</div>
              <div className="terminal-connection-badge">
                <span className="green-pulse-dot"></span>
                <span>0x8f...2e (SOLANA MAINNET)</span>
              </div>
            </div>

            {/* Terminal Workspace */}
            <div className="terminal-workspace-grid">
              
              {/* Left Column: Live Chart Area */}
              <div className="terminal-chart-column">
                <div className="chart-info-header">
                  <div className="asset-details">
                    <span className="asset-name">BTC / USD</span>
                    <span className="price-label">${btcPrice.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                  </div>
                  <div className="price-change-metric">
                    <span className="metric-arrow">&uarr;</span>
                    <span>+4.25%</span>
                  </div>
                </div>

                {/* Professional Candlestick Chart visual */}
                <div className="chart-canvas-mock">
                  <div className="chart-grid-watermark-lines">
                    <div className="g-line"></div>
                    <div className="g-line"></div>
                    <div className="g-line"></div>
                    <div className="g-line"></div>
                  </div>
                  <div className="candlestick-track">
                    {candles.map((c, idx) => {
                      const height = Math.abs(c.open - c.close)
                      const bottom = Math.min(c.open, c.close)
                      return (
                        <div key={idx} className="candle-column">
                          {/* Candle Wick */}
                          <div 
                            className={`candle-wick ${c.isGreen ? 'green' : 'red'}`}
                            style={{ 
                              height: `${c.wickHigh - c.wickLow}px`, 
                              bottom: `${c.wickLow}px` 
                            }}
                          ></div>
                          {/* Candle Body */}
                          <div 
                            className={`candle-body ${c.isGreen ? 'green' : 'red'}`}
                            style={{ 
                              height: `${height}px`, 
                              bottom: `${bottom}px` 
                            }}
                          ></div>
                          {/* Volume Bar */}
                          <div 
                            className={`candle-volume ${c.isGreen ? 'green' : 'red'}`}
                            style={{ height: `${c.volume}px` }}
                          ></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Execution Trade Slip */}
              <div className="terminal-trade-slip">
                <div className="slip-tab-row">
                  <span className={orderTab === 'limit' ? 'active' : ''} onClick={() => setOrderTab('limit')}>LIMIT</span>
                  <span className={orderTab === 'market' ? 'active' : ''} onClick={() => setOrderTab('market')}>MARKET</span>
                  <span className="disabled-tab">STOP</span>
                </div>
                
                <div className="slip-type-row">
                  <button className={`btn-slip btn-buy ${tradeType === 'buy' ? 'active' : ''}`} onClick={() => setTradeType('buy')}>BUY</button>
                  <button className={`btn-slip btn-sell ${tradeType === 'sell' ? 'active' : ''}`} onClick={() => setTradeType('sell')}>SELL</button>
                </div>

                <div className="slip-input-group">
                  <label>Order Price (USD)</label>
                  <input type="text" value={btcPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} readOnly />
                </div>

                <div className="slip-input-group">
                  <label>Order Amount (BTC)</label>
                  <input type="text" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} />
                </div>

                <div className="percentage-chips-row">
                  {['25%', '50%', '75%', 'Max'].map((pct) => (
                    <span 
                      key={pct} 
                      className="pct-chip"
                      onClick={() => {
                        if (pct === 'Max') setOrderAmount('1.00')
                        else setOrderAmount((Number(pct.replace('%','')) / 100).toFixed(2))
                      }}
                    >
                      {pct}
                    </span>
                  ))}
                </div>

                <div className="slip-balance-lbl">
                  <span>Balance: ${usdBalance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} USD</span>
                </div>

                <button className="btn-slip-execute" onClick={handlePlaceOrder}>
                  Place {tradeType.toUpperCase()} Order
                </button>
              </div>

            </div>

            {/* Bottom Section: Matched transaction stream logs */}
            <div className="terminal-matched-ledger-block">
              <div className="ledger-stream-title">Live Transaction Matching Ledger</div>
              
              <table className="ledger-table-grid">
                <thead>
                  <tr>
                    <th>TYPE</th>
                    <th>PRICE (USD)</th>
                    <th>SIZE (BTC)</th>
                    <th>STATUS</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {tradeLogs.map((log) => (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      >
                        <td>
                          <span className={`lbl-badge ${log.type === 'BUY' ? 'buy' : 'sell'}`}>{log.type}</span>
                        </td>
                        <td className="monospace font-bold">${log.price}</td>
                        <td className="monospace color-slate">{log.qty}</td>
                        <td>
                          <div className="status-flex">
                            <span className="glow-green-pulse"></span>
                            <span className="lbl-status">{log.status}</span>
                          </div>
                        </td>
                        <td className="color-slate-light">{log.time}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

            </div>

          </motion.div>
        </div>
      </section>

      {/* Partner Scrolling Marquee */}
      <section className="partners-marquee-section">
        <div className="marquee-label">TRUSTED BY INSTITUTIONS</div>
        <div className="marquee-wrapper">
          <div className="marquee-track">
            <span>Ethereum Foundation</span>
            <span>Solana Labs</span>
            <span>Arbitrum One</span>
            <span>Optimism Gov</span>
            <span>Avalanche Labs</span>
            <span>Polygon Tech</span>
            <span>Ethereum Foundation</span>
            <span>Solana Labs</span>
            <span>Arbitrum One</span>
            <span>Optimism Gov</span>
            <span>Avalanche Labs</span>
            <span>Polygon Tech</span>
          </div>
        </div>
      </section>

      {/* Main Core Features Bento Grid */}
      <section className="features-grid-section">
        <div className="section-label">PERFORMANCE BENCHMARKS</div>
        <h2 className="section-title">Engineered for Sub-millisecond Execution.</h2>
        
        <div className="features-grid">
          
          {/* Feature 1: Latency Comparison */}
          <motion.div 
            className="feature-card"
            whileHover={{ y: -8, boxShadow: "0 25px 50px rgba(15, 23, 42, 0.05)" }}
          >
            <div className="feat-header">
              <span className="feat-badge"><Cpu size={10} style={{ display: 'inline', marginRight: 4 }} /> SPEED</span>
              <h3>1.2ms Matching Engine</h3>
            </div>
            <p>Our custom memory matching stack matches buy/sell orders at sub-millisecond rates, preventing front-running.</p>
            
            <div className="bar-chart-visual">
              <div className="chart-row">
                <span className="row-name">Agora Engine</span>
                <div className="bar-wrapper">
                  <motion.div 
                    className="bar-fill green-bar" 
                    initial={{ width: 0 }}
                    whileInView={{ width: '8%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  ></motion.div>
                  <span className="bar-lbl">1.2ms</span>
                </div>
              </div>
              <div className="chart-row">
                <span className="row-name">Traditional DEX</span>
                <div className="bar-wrapper">
                  <motion.div 
                    className="bar-fill grey-bar" 
                    initial={{ width: 0 }}
                    whileInView={{ width: '90%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  ></motion.div>
                  <span className="bar-lbl">450ms</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Staking Calculator */}
          <motion.div 
            className="feature-card"
            whileHover={{ y: -8, boxShadow: "0 25px 50px rgba(15, 23, 42, 0.05)" }}
          >
            <div className="feat-header">
              <span className="feat-badge"><Sliders size={10} style={{ display: 'inline', marginRight: 4 }} /> STAKING</span>
              <h3>Liquid Rewards Calculator</h3>
            </div>
            <p>Calculate your passive compound staking yields across our validator nodes dynamically.</p>
            
            <div className="stake-calc-box">
              <div className="stake-calc-header">
                <span>Principal Amount</span>
                <strong>${stakeAmount.toLocaleString()}</strong>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="100000" 
                step="1000" 
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                className="range-input-light"
              />
              
              <div className="asset-calc-row">
                <button className={selectedAsset === 'SOL' ? 'active' : ''} onClick={() => handleAssetChange('SOL')}>SOL (12.8%)</button>
                <button className={selectedAsset === 'ETH' ? 'active' : ''} onClick={() => handleAssetChange('ETH')}>ETH (8.4%)</button>
                <button className={selectedAsset === 'BTC' ? 'active' : ''} onClick={() => handleAssetChange('BTC')}>BTC (4.2%)</button>
              </div>

              <div className="est-calc-yield">
                <span>Estimated Annual Earnings:</span>
                <span className="yield-val">${((stakeAmount * apy) / 100).toLocaleString(undefined, {maximumFractionDigits: 2})} USD</span>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Security Auditor */}
          <motion.div 
            className="feature-card"
            whileHover={{ y: -8, boxShadow: "0 25px 50px rgba(15, 23, 42, 0.05)" }}
          >
            <div className="feat-header">
              <span className="feat-badge"><Shield size={10} style={{ display: 'inline', marginRight: 4 }} /> SECURITY</span>
              <h3>Audited Custody Flow</h3>
            </div>
            <p>Our protocol relies on non-custodial multi-signature vaults verified continuously by third-party auditors.</p>
            
            <div className="security-steps-list">
              <div className="step-item">
                <span className="step-bullet"><Check size={10} /></span>
                <span>Multi-Signature Ledger Consensus</span>
              </div>
              <div className="step-item">
                <span className="step-bullet"><Check size={10} /></span>
                <span>CertiK Security Audit Verified</span>
              </div>
              <div className="step-item">
                <span className="step-bullet"><Check size={10} /></span>
                <span>Time-locked Validator Withdrawals</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-newsletter-section">
        <div className="cta-wrapper-card">
          <h2>Secure your allocation today.</h2>
          <p>Join over 124,000+ traders matching orders directly through our liquidity protocol.</p>
          
          {subscribed ? (
            <motion.div 
              className="sub-success-message"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <span>&checkmark;</span> Thank you! You have been added to the early access list.
            </motion.div>
          ) : (
            <form onSubmit={handleSubscribe} className="cta-form-row">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
              <button type="submit">
                Get Early Access <ArrowRight size={14} style={{ display: 'inline', marginLeft: 4 }} />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Styled Footer */}
      <footer className="footer-light">
        <div className="footer-grid">
          <div className="footer-brand-column">
            <div className="footer-logo-row">
              <svg viewBox="0 0 24 24" className="logo-svg" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Agora</span>
            </div>
            <p className="footer-brand-desc">Institutional grade cross-chain matching protocol operating at sub-millisecond latencies.</p>
          </div>
          
          <div className="footer-nav-column">
            <h5>PRODUCT</h5>
            <span>DEX Sandbox</span>
            <span>Liquidity Pools</span>
            <span>Staking Vaults</span>
            <span>Ledger Audit</span>
          </div>

          <div className="footer-nav-column">
            <h5>DEVELOPERS</h5>
            <span>Smart Contracts</span>
            <span>gRPC Gateway</span>
            <span>API Docs</span>
            <span>SDK Github</span>
          </div>

          <div className="footer-nav-column">
            <h5>RESOURCES</h5>
            <span>System Status</span>
            <span>Security Audits</span>
            <span>Brand Assets</span>
            <span>Contact Labs</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 AGORA LABS INC. ALL RIGHTS RESERVED.</span>
          <span className="status-indicator-tag">RPC CONNECTED [1.2ms]</span>
        </div>
      </footer>

    </div>
  )
}

export default App
