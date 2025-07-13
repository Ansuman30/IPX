'use client'
import React, { useState, useEffect } from "react";
import { ChevronDown, ExternalLink, Shield, Zap, Clock, DollarSign, Youtube, FileText, Github, Music, Book, Link, CheckCircle, AlertCircle, Upload, Calendar, Info, X, Check, Loader } from "lucide-react";

export default function IPRegistrationPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [principalId] = useState("rdmx6-jaaaa-aaaah-qcaiq-cai");
  const [showIdentityDropdown, setShowIdentityDropdown] = useState(false);
  
  // Form State
  const [selectedIPType, setSelectedIPType] = useState('');
  const [formData, setFormData] = useState({
    ipType: '',
    assetUrl: '',
    description: '',
    title: '',
    revenueConnected: false,
    revenuePercentage: 20,
    bondTerm: 12,
    streamType: 'linear',
    manualProof: null
  });
  
  // Validation States
  const [validationStatus, setValidationStatus] = useState(null); // null, 'validating', 'verified', 'failed', 'manual'
  const [validationError, setValidationError] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintedNFTId, setMintedNFTId] = useState('');

  const ipTypes = [
    { 
      id: 'youtube', 
      name: 'YouTube Channel', 
      icon: Youtube, 
      color: 'from-red-500 to-red-600',
      description: 'Monetize YouTube ad revenue & memberships',
      placeholder: 'https://youtube.com/@yourchannel or Channel ID',
      apiEndpoint: 'youtube_api'
    },
    { 
      id: 'substack', 
      name: 'Substack Publication', 
      icon: FileText, 
      color: 'from-orange-500 to-amber-600',
      description: 'Token-gate newsletter subscriptions',
      placeholder: 'https://yourname.substack.com',
      apiEndpoint: 'substack_api'
    },
    { 
      id: 'github', 
      name: 'GitHub Repository', 
      icon: Github, 
      color: 'from-gray-600 to-gray-700',
      description: 'Monetize GitHub Sponsors & contributions',
      placeholder: 'https://github.com/username/repo or @username',
      apiEndpoint: 'github_api'
    },
    { 
      id: 'spotify', 
      name: 'Spotify Artist', 
      icon: Music, 
      color: 'from-green-500 to-emerald-600',
      description: 'Share streaming royalties with fans',
      placeholder: 'Spotify Artist URI or Profile URL',
      apiEndpoint: 'spotify_api'
    },
    { 
      id: 'kindle', 
      name: 'Amazon KDP Book', 
      icon: Book, 
      color: 'from-blue-500 to-blue-600',
      description: 'Tokenize book royalties & sales',
      placeholder: 'Amazon ASIN or Book URL',
      apiEndpoint: 'kdp_api'
    }
  ];

  const streamTypes = [
    { id: 'linear', name: 'Linear over time', description: 'Equal payments throughout the term' },
    { id: 'performance', name: 'Performance-based', description: 'Payments based on actual revenue' },
    { id: 'cliff', name: 'Cliff + Stream', description: 'Lump sum after period + streaming' }
  ];

  const bondTerms = [3, 6, 12, 18, 24];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const selectedIPTypeData = ipTypes.find(type => type.id === selectedIPType);

  const validateIPOwnership = async () => {
    if (!formData.assetUrl) return;
    
    setValidationStatus('validating');
    setValidationError('');
    setAlreadyRegistered(false);
    
    // Simulate API validation
    setTimeout(() => {
      const isValid = Math.random() > 0.3; // 70% success rate for demo
      const isAlreadyRegistered = Math.random() > 0.8; // 20% already registered
      
      if (isAlreadyRegistered) {
        setAlreadyRegistered(true);
        setValidationStatus('failed');
        return;
      }
      
      if (isValid) {
        setValidationStatus('verified');
        // Auto-fill title and description from "API"
        setFormData(prev => ({
          ...prev,
          title: `Sample ${selectedIPTypeData?.name} Title`,
          description: `Auto-generated description for ${selectedIPTypeData?.name}`
        }));
      } else {
        setValidationStatus('failed');
        setValidationError('Cannot verify source. Please check the URL or provide manual proof.');
      }
    }, 2000);
  };

  const handleManualProofUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, manualProof: file }));
      setValidationStatus('manual');
    }
  };

  const calculateEstimatedDates = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + formData.bondTerm);
    
    return {
      start: startDate.toLocaleDateString(),
      end: endDate.toLocaleDateString()
    };
  };

  const calculateProtocolFee = () => {
    const baseFee = 0.2;
    const complexityMultiplier = selectedIPType === 'other' ? 1.5 : 1;
    return (baseFee * complexityMultiplier).toFixed(2);
  };

  const isFormValid = () => {
    return (
      selectedIPType &&
      formData.assetUrl &&
      (validationStatus === 'verified' || validationStatus === 'manual') &&
      agreedToTerms &&
      !alreadyRegistered
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    // Simulate registration
    setTimeout(() => {
      const nftId = `#${Math.random().toString(36).substr(2, 9)}`;
      setMintedNFTId(nftId);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 3000);
  };

  const SubtleGrid = () => (
    <div className="absolute inset-0 opacity-5">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id="subtlegrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(249 115 22 / 0.3)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#subtlegrid)" />
      </svg>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-orange-400" />
          <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please connect with Internet Identity to continue</p>
          <button
            onClick={() => setIsAuthenticated(true)}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-300"
          >
            Connect Identity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black text-white overflow-hidden">
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); }
          50% { box-shadow: 0 0 30px rgba(249, 115, 22, 0.6); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .gradient-text {
          background: linear-gradient(-45deg, #f97316, #f59e0b, #fb923c, #f97316);
          background-size: 400% 400%;
          animation: gradient-shift 3s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .step-indicator {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-gray-900 to-black" />
        <SubtleGrid />
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/20 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">IP Successfully Registered!</h3>
            <p className="text-gray-300 mb-2">Your IP has been registered and NFT bond created.</p>
            <p className="text-orange-400 font-mono text-lg mb-6">NFT ID: {mintedNFTId}</p>
            <div className="flex flex-col sm:flex-row gap-3">
            <button
  onClick={() => {
    setShowSuccessModal(false);
    window.location.href = '/vault';
  }}
  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-300"
>
  View in Dashboard
</button>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Reset form
                  setSelectedIPType('');
                  setFormData({
                    ipType: '',
                    assetUrl: '',
                    description: '',
                    title: '',
                    revenueConnected: false,
                    revenuePercentage: 20,
                    bondTerm: 12,
                    streamType: 'linear',
                    manualProof: null
                  });
                  setValidationStatus(null);
                  setAgreedToTerms(false);
                }}
                className="flex-1 px-6 py-3 border border-orange-500/30 text-orange-300 font-semibold rounded-lg hover:bg-orange-500/10 transition-all duration-300"
              >
                Mint Another IP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen py-12">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          
          {/* Header */}
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text" style={{ fontFamily: "Holtwood One SC, serif", fontSize: "3.5rem", letterSpacing: "0.3rem" }}>
                Register Your IP
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Transform your intellectual property into tradeable revenue streams
            </p>
          </div>

          {/* Section 1: Identity & Access */}
          <div className={`mb-8 transition-all duration-1000 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="bg-gradient-to-r from-gray-900/30 to-black/30 backdrop-blur-sm rounded-xl p-4 border border-orange-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Logged in as:</span>
                  <span className="font-mono text-orange-400">{principalId.slice(0, 20)}...</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowIdentityDropdown(!showIdentityDropdown)}
                    className="flex items-center space-x-2 text-sm text-gray-300 hover:text-orange-300 transition-colors"
                  >
                    <span>Switch Identity</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showIdentityDropdown && (
                    <div className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-lg p-2 min-w-[200px] z-10">
                      <div className="text-xs text-gray-400 p-2">No other identities available</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: IP Asset Metadata */}
          <div className={`mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/20">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center text-white font-bold mr-3">2</span>
                IP Asset Metadata
              </h2>

              {/* IP Type Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-4">Choose IP Type *</label>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ipTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <div
                        key={type.id}
                        onClick={() => {
                          setSelectedIPType(type.id);
                          setFormData(prev => ({ ...prev, ipType: type.id }));
                          setValidationStatus(null);
                        }}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                          selectedIPType === type.id
                            ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border-orange-500/60'
                            : 'bg-gradient-to-r from-gray-800/30 to-gray-900/30 border-gray-600/30 hover:border-orange-500/40'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${type.color}`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{type.name}</span>
                        </div>
                        <p className="text-sm text-gray-400">{type.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Metadata Form */}
              {selectedIPType && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {selectedIPTypeData?.name} URL or ID *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.assetUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, assetUrl: e.target.value }))}
                        placeholder={selectedIPTypeData?.placeholder}
                        className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                          validationStatus === 'failed' ? 'border-red-500' : 
                          validationStatus === 'verified' ? 'border-green-500' :
                          'border-gray-600 focus:border-orange-500'
                        }`}
                      />
                      <Link className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                    
                    {/* Validation Status */}
                    <div className="mt-2">
                      {formData.assetUrl && validationStatus === null && (
                        <button
                          onClick={validateIPOwnership}
                          className="flex items-center space-x-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Validate ownership</span>
                        </button>
                      )}
                      
                      {validationStatus === 'validating' && (
                        <div className="flex items-center space-x-2 text-sm text-blue-400">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Validating ownership...</span>
                        </div>
                      )}
                      
                      {validationStatus === 'verified' && (
                        <div className="flex items-center space-x-2 text-sm text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Ownership verified</span>
                        </div>
                      )}
                      
                      {validationStatus === 'failed' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>{validationError}</span>
                          </div>
                          {!alreadyRegistered && (
                            <div className="mt-3">
                              <label className="block text-sm text-gray-300 mb-2">Upload Manual Proof</label>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleManualProofUpload}
                                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-700 transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {validationStatus === 'manual' && (
                        <div className="flex items-center space-x-2 text-sm text-yellow-400">
                          <Upload className="w-4 h-4" />
                          <span>Manual proof uploaded - pending review</span>
                        </div>
                      )}
                      
                      {alreadyRegistered && (
                        <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
                          <div className="flex items-center space-x-2 text-sm text-yellow-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>This IP is already tokenized in the protocol</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Auto-filled or Manual Fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter title or auto-fill from validation"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Revenue Connected</label>
                      <div className="flex items-center space-x-3 pt-3">
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, revenueConnected: !prev.revenueConnected }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            formData.revenueConnected ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.revenueConnected ? 'translate-x-6' : 'translate-x-0.5'
                          }`}></div>
                        </button>
                        <span className="text-sm text-gray-300">
                          {formData.revenueConnected ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your IP asset and revenue model..."
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Tokenization Parameters */}
          {selectedIPType && (validationStatus === 'verified' || validationStatus === 'manual') && (
            <div className={`mb-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/20">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center text-white font-bold mr-3">3</span>
                  Tokenization Parameters
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Revenue Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      What % of revenue to tokenize?
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="5"
                        max="90"
                        value={formData.revenuePercentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, revenuePercentage: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>5%</span>
                        <span className="text-orange-400 font-bold text-lg">{formData.revenuePercentage}%</span>
                        <span>90%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bond Term */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      Over what duration?
                    </label>
                    <select
                      value={formData.bondTerm}
                      onChange={(e) => setFormData(prev => ({ ...prev, bondTerm: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
                    >
                      {bondTerms.map(term => (
                        <option key={term} value={term}>{term} months</option>
                      ))}
                    </select>
                    <div className="mt-2 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Est. {calculateEstimatedDates().start} → {calculateEstimatedDates().end}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Stream Type */}
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-300 mb-4">Revenue Stream Type</label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {streamTypes.map(stream => (
                      <div
                        key={stream.id}
                        onClick={() => setFormData(prev => ({ ...prev, streamType: stream.id }))}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-300 ${
                          formData.streamType === stream.id
                            ? 'bg-orange-600/20 border-orange-500/60'
                            : 'bg-gray-800/30 border-gray-600/30 hover:border-orange-500/40'
                        }`}
                      >
                        <h4 className="font-medium mb-2">{stream.name}</h4>
                        <p className="text-sm text-gray-400">{stream.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Protocol Fee + Disclaimer */}
          {selectedIPType && (validationStatus === 'verified' || validationStatus === 'manual') && (
            <div className={`mb-8 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/20">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center text-white font-bold mr-3">4</span>
                  Protocol Fees & Terms
                </h2>

                {/* Fee Display */}
                <div className="bg-gray-800/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300">Estimated Protocol Fee:</span>
                    <span className="text-2xl font-bold text-orange-400">{calculateProtocolFee()} ICP</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <div className="flex justify-between mb-1">
                      <span>Base minting fee:</span>
                      <span>0.2 ICP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Launch pool setup:</span>
                      <span>Included</span>
                    </div>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded transition-colors ${
                        agreedToTerms ? 'bg-orange-500 border-orange-500' : 'border-gray-600'
                      }`}>
                        {agreedToTerms && <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      I verify that I own this IP and agree to the protocol's revenue bonding rules, including revenue sharing terms and dispute resolution procedures. <span className="text-red-400">*</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Review + Submit */}
          {selectedIPType && (validationStatus === 'verified' || validationStatus === 'manual') && (
            <div className={`mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/20">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center text-white font-bold mr-3">5</span>
                  Review & Submit
                </h2>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-orange-600/10 to-amber-600/10 rounded-xl p-6 border border-orange-500/20 mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-orange-400">Registration Summary</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">IP Type:</span>
                        <span className="font-medium">{selectedIPTypeData?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Asset Link:</span>
                        <span className="font-mono text-sm text-orange-400 truncate max-w-[200px]">
                          {formData.assetUrl}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Revenue %:</span>
                        <span className="font-medium text-orange-400">{formData.revenuePercentage}%</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Term:</span>
                        <span className="font-medium">{formData.bondTerm} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Stream Type:</span>
                        <span className="font-medium capitalize">{formData.streamType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Protocol Fee:</span>
                        <span className="font-medium text-orange-400">{calculateProtocolFee()} ICP</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid() || isSubmitting}
                    className={`group relative px-12 py-4 font-semibold text-lg rounded-xl transition-all duration-300 transform overflow-hidden ${
                      isFormValid() && !isSubmitting
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 hover:scale-105'
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center justify-center">
                      {isSubmitting ? (
                        <>
                          <Loader className="mr-2 w-5 h-5 animate-spin" />
                          Registering IP...
                        </>
                      ) : (
                        <>
                          Register IP & Mint Bond NFT
                          <Zap className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </span>
                  </button>
                  
                  {/* Always show validation feedback */}
                  <div className="mt-3 text-sm">
                    {!selectedIPType && (
                      <p className="text-red-400">⚠️ Please select an IP type above</p>
                    )}
                    {selectedIPType && !formData.assetUrl && (
                      <p className="text-red-400">⚠️ Please enter your asset URL</p>
                    )}
                    {formData.assetUrl && validationStatus === null && (
                      <p className="text-yellow-400">⚠️ Please validate ownership of your asset</p>
                    )}
                    {formData.assetUrl && validationStatus === 'failed' && !alreadyRegistered && (
                      <p className="text-yellow-400">⚠️ Validation failed - please upload manual proof</p>
                    )}
                    {(validationStatus === 'verified' || validationStatus === 'manual') && !agreedToTerms && (
                      <p className="text-red-400">⚠️ Please agree to the terms and conditions</p>
                    )}
                    {alreadyRegistered && (
                      <p className="text-red-400">❌ This IP is already registered in the protocol</p>
                    )}
                    {isFormValid() && !isSubmitting && (
                      <p className="text-green-400">✅ Ready to register your IP asset</p>
                    )}
                  </div>
                </div>

                {/* Loading State Details */}
                {isSubmitting && (
                  <div className="mt-6 bg-gray-800/30 rounded-xl p-4">
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <span>Creating NFT bond...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Setting up launchpool...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Finalizing registration...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent lg:hidden z-20">
        {selectedIPType && (
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className={`w-full py-4 font-semibold text-lg rounded-xl transition-all duration-300 ${
              isFormValid() && !isSubmitting
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader className="mr-2 w-5 h-5 animate-spin" />
                Registering...
              </span>
            ) : (
              'Register IP & Mint Bond NFT'
            )}
          </button>
        )}
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
      </div>)}