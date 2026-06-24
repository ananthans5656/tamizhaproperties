import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Linking,
  StatusBar,
  Platform,
  Alert,
  Share,
  Modal,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageView from 'react-native-image-viewing';
import { api, getUserSession, getUserProfile, getLeadId, saveLeadId, getSavedProperties, toggleSavedProperty, normalizeImageUrl } from '../services/api';

const { width } = Dimensions.get('window');

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
];

const PropertyDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const params = route?.params || {};

  const [propertyData, setPropertyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.propertyId) {
      setLoading(false);
      return;
    }
    api.getProperty(params.propertyId)
      .then(data => { setPropertyData(data); setLoading(false); })
      .catch(err => { console.log('Error fetching property:', err); setLoading(false); });
  }, [params.propertyId]);

  const data = propertyData || {};
  const propertyTitle = data.title || params.title || 'Untitled Property';
  const propertyPrice = data.price || params.price || '₹0';
  const propertyPriceLabel = data.priceLabel || params.priceLabel || 'TOTAL';
  const propertyLocation = data.location || params.location || 'Location not specified';
  const propertySize = data.size || data.grounds || params.size || '—';
  const locationHighlights = data.locationHighlights || params.locationHighlights || '';
  const propertyHeroImage = normalizeImageUrl((data.images && data.images[0]) || data.image || params.image || GALLERY_IMAGES[0]);
  const propertyTag = data.tag || (data.isPrimeAsset ? 'PRIME ASSET' : params.tag || 'FOR SALE');
  const description = data.description || params.description || 'No description provided for this premium property.';

  // Specifications
  const sqft = data.sqft || params.sqft || '—';
  const grounds = data.grounds || params.grounds || '—';
  const amenity = data.amenity || params.amenity || 'Standard';

  // Checkboxes
  const isReraVerified = data.isReraVerified || false;
  const isNegotiable = data.isNegotiable || false;
  const isPrimeAsset = data.isPrimeAsset || false;

  // Video
  const videoUrl = data.videoUrl || params.videoUrl || '';

  // Offers
  const offerCode = data.offerCode || params.offerCode || '';
  const offerValue = data.offerValue || params.offerValue || '';
  const bankOffer = data.bankOffer || params.bankOffer || '';
  const partnerOffer = data.partnerOffer || params.partnerOffer || '';

  // Key Features
  const featuresMode = data.featuresMode || 'paragraph';
  const featuresContent = data.featuresContent || ''; // string or string[]

  // Documents
  const documents = data.documents || data.uploadedDocs || [];

  const galleryList = data.images && data.images.length > 0
    ? data.images.map(normalizeImageUrl)
    : [propertyHeroImage];

  const dynamicGallery = galleryList;

  // Full-screen viewer uses only real images
  const viewerImages = dynamicGallery.map((uri: string) => ({ uri }));

  const [isSaved, setIsSaved] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  React.useEffect(() => {
    if (!params.propertyId) return;
    getSavedProperties().then(ids => setIsSaved(ids.includes(String(params.propertyId)))).catch(() => {});
  }, [params.propertyId]);

  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', icon: '' });
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('Morning');
  const [isScheduling, setIsScheduling] = useState(false);
  const startTimeRef = React.useRef(Date.now());

  const handleScheduleVisit = async () => {
    if (!visitDate) {
      Alert.alert('Date Required', 'Please provide a date for your visit.');
      return;
    }
    try {
      setIsScheduling(true);
      const session = await getUserSession();
      const profile = await getUserProfile();
      const clientName = profile?.name || session?.name || 'Anonymous Investor';
      const clientPhone = profile?.phoneNumber || 'Not provided';
      const leadId = await getLeadId();

      const timeSlot = visitTime === 'Morning' ? '10:30 AM' : visitTime === 'Afternoon' ? '02:00 PM' : '05:00 PM';

      await api.createSiteVisit({
        lead_id: leadId || null,
        property_id: params.propertyId || null,
        visit_date: visitDate,
        status: 'scheduled',
        notes: `Booked via App by ${clientName}. Time: ${timeSlot}`,
      });

      // Twilio SMS
      const ADMIN_MOBILE = '+917010296572';
      const TWILIO_SID = process.env.TWILIO_SID || '';
      const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
      const TWILIO_NUMBER = '+15756004281';
      const SMS_MESSAGE = `[NEW SITE VISIT] 📅\n👤 ${clientName}\n📞 ${clientPhone}\n🏘️ ${propertyTitle}\n🗓️ ${visitDate} @ ${timeSlot}\nConfirm in Admin App.`;

      const base64 = (str: string) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';
        for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = '=', i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
          charCode = str.charCodeAt(i += 3 / 4);
          if (charCode > 0xFF) throw new Error("'btoa' failed.");
          block = block << 8 | charCode;
        }
        return output;
      };

      const authHeader = 'Basic ' + base64(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`);
      const details: any = { 'To': ADMIN_MOBILE, 'From': TWILIO_NUMBER, 'Body': SMS_MESSAGE };
      const formBody = Object.keys(details).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key])).join('&');

      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authHeader },
        body: formBody,
      });

      setShowVisitModal(false);
      setIsScheduling(false);
      setCustomAlert({ visible: true, title: 'Visit Scheduled! ✅', message: 'Your site visit request has been sent. Our team will confirm shortly.', icon: '✅' });
    } catch (error) {
      console.log('Site visit error:', error);
      setIsScheduling(false);
      setCustomAlert({ visible: true, title: 'Error', message: 'Failed to schedule visit. Please try again.', icon: '⚠️' });
    }
  };


  const handleSave = async () => {
    if (!params.propertyId) return;
    try {
      const nowSaved = await toggleSavedProperty(String(params.propertyId));
      setIsSaved(nowSaved);
      if (nowSaved) {
        setCustomAlert({ visible: true, title: 'Saved! ❤️', message: 'Property saved to your favourites list.', icon: '❤️' });
      }
    } catch (e: any) {
      Alert.alert('Save Failed', 'Could not save property. Please try again.\n' + (e?.message || ''));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: propertyTitle,
        message: `🏘️ ${propertyTitle} - ${propertyLocation}\n💰 ${propertyPrice} ${propertyPriceLabel}\n\nView on Tamizha Properties App!`,
      });
    } catch (error) {
      Alert.alert('Share', 'Property link copied!');
    }
  };

  const handleEnquiry = async () => {
    try {
      const session = await getUserSession();
      const profile = await getUserProfile();
      const clientName = profile?.name || session?.name || 'Anonymous Investor';
      const clientPhone = profile?.phoneNumber || 'Not provided';
      const clientEmail = session?.email || '';
      const clientCity = profile?.currentCity || 'Unknown';
      const clientNative = profile?.nativePlace || 'Unknown';

      // Avoid duplicate leads — reuse existing lead if available
      let existingLeadId = await getLeadId();
      if (!existingLeadId && session?.id) {
        const existing = await api.getLeadByUser(session.id).catch(() => null);
        if (existing?.id) { existingLeadId = existing.id; await saveLeadId(existing.id); }
      }
      if (!existingLeadId && clientEmail) {
        const allLeads = await api.getLeads().catch(() => []);
        const matched = allLeads.find((l: any) => l.email?.toLowerCase() === clientEmail.toLowerCase());
        if (matched?.id) { existingLeadId = matched.id; await saveLeadId(matched.id); }
      }

      if (!existingLeadId) {
        const newLead = await api.createLead({
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          source: 'User App Enquiry',
          status: 'new',
          notes: `Enquiry for: ${propertyTitle} (${propertyLocation}) | City: ${clientCity} | Native: ${clientNative}`,
          property_interest: propertyTitle,
        });
        if (newLead?.id) await saveLeadId(newLead.id);
      }

      // --- TWILIO SMS ALERT LOGIC ---
      const ADMIN_MOBILE = '+917010296572';
      const TWILIO_SID = process.env.TWILIO_SID || '';
      const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
      const TWILIO_NUMBER = '+15756004281';

      const SMS_MESSAGE = `[TAMIZHA PROPERTIES: NEW LEAD]\n👤 CLIENT: ${clientName}\n📞 CONTACT: ${clientPhone}\n🗺️ RESIDENCE: ${clientCity}\n🏘️ PROPERTY: ${propertyTitle}\n🏠 NATIVE: ${clientNative}`;

      try {
        const base64 = (str: string) => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          let output = '';
          for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = '=', i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
            charCode = str.charCodeAt(i += 3 / 4);
            if (charCode > 0xFF) throw new Error("'btoa' failed.");
            block = block << 8 | charCode;
          }
          return output;
        };

        const authHeader = 'Basic ' + base64(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`);
        const details: any = { 'To': ADMIN_MOBILE, 'From': TWILIO_NUMBER, 'Body': SMS_MESSAGE };
        const formBody = Object.keys(details).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key])).join('&');

        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authHeader },
          body: formBody,
        });
        console.log('Twilio SMS Re-Triggered');
      } catch (smsError) {
        console.log('Twilio Error:', smsError);
      }

      setCustomAlert({ visible: true, title: 'Inquiry Received!', message: 'Our heritage experts have been notified. Expect a call shortly to discuss your investment future.', icon: '✓' });
    } catch (error: any) {
      console.log('Enquiry error:', error);
      setCustomAlert({ visible: true, title: 'Error', message: 'Failed to send enquiry. Please try again.', icon: '⚠️' });
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tamizha Properties</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
          <Text style={styles.headerIcon}>🔗</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0B132B" />
          <Text style={{ marginTop: 10, fontSize: 13, color: '#888', fontWeight: '600' }}>Loading details...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Main Image Banner */}
          <View style={styles.heroContainer}>
            <View style={styles.heroImageWrapper}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => { setViewerIndex(activeGalleryIndex); setIsViewerVisible(true); }}
              >
                <Image
                  source={{ uri: dynamicGallery[activeGalleryIndex] || propertyHeroImage }}
                  style={styles.heroImage}
                />
              </TouchableOpacity>
              <View style={styles.featuredListingBadge}>
                <Text style={styles.featuredListingText}>{propertyTag || 'FEATURED LISTING'}</Text>
              </View>
            </View>

            {/* Mini Gallery */}
            <View style={styles.galleryContainer}>
              {dynamicGallery.slice(0, 4).map((uri: string, index: number) => {
                const isLast = index === 3 && dynamicGallery.length > 4;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.galleryImageWrapper, activeGalleryIndex === index && styles.galleryImageActive]}
                    onPress={() => {
                      if (isLast) {
                        setViewerIndex(3);
                        setIsViewerVisible(true);
                      } else {
                        setActiveGalleryIndex(index);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri }}
                      style={[styles.galleryImage, isLast && { opacity: 0.5 }]}
                    />
                    {isLast && (
                      <View style={styles.moreImagesOverlay}>
                        <Text style={styles.moreImagesText}>+{dynamicGallery.length - 3}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Property Header Info */}
          <View style={styles.contentSection}>
            <Text style={styles.title}>{propertyTitle}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationText}>{propertyLocation}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {isReraVerified && (
                <View style={[styles.heritageBadge, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.heritageIcon, { color: '#2E7D32' }]}>✓</Text>
                  <Text style={[styles.heritageText, { color: '#2E7D32' }]}>RERA VERIFIED</Text>
                </View>
              )}
              {isPrimeAsset && (
                <View style={[styles.heritageBadge, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={[styles.heritageIcon, { color: '#7B1FA2' }]}>⚡</Text>
                  <Text style={[styles.heritageText, { color: '#7B1FA2' }]}>PRIME ASSET</Text>
                </View>
              )}
              {isNegotiable && (
                <View style={[styles.heritageBadge, { backgroundColor: '#FFEBEE' }]}>
                  <Text style={[styles.heritageIcon, { color: '#C62828' }]}>🤝</Text>
                  <Text style={[styles.heritageText, { color: '#C62828' }]}>NEGOTIABLE PRICE</Text>
                </View>
              )}
            </View>
          </View>

          {/* Virtual Tour Section */}
          {videoUrl ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VIRTUAL PROPERTY TOUR</Text>
              <TouchableOpacity
                style={styles.videoPlayerPlaceholder}
                onPress={() => Linking.openURL(videoUrl)}
              >
                <Image
                  source={{ uri: propertyHeroImage }}
                  style={styles.placeholderImg}
                />
                <View style={styles.playOverlay}>
                  <View style={styles.playCircle}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <Text style={styles.playText}>WATCH CINEMATIC TOUR</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Investment Growth Chart Mock */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Investment Growth</Text>
                <Text style={styles.chartSub}>10-Year Value Forecast</Text>
              </View>
              <View style={styles.chartGrowthBadge}>
                <Text style={styles.growthValue}>+142%</Text>
                <Text style={styles.growthLabel}>EST. RETURN</Text>
              </View>
            </View>

            <View style={styles.chartBars}>
              {/* Dummy Bar Chart */}
              <View style={styles.barItem}><View style={[styles.bar, styles.barGrey, { height: '30%' }]} /><Text style={styles.barLabel}>2024</Text></View>
              <View style={styles.barItem}><View style={[styles.bar, styles.barGrey, { height: '40%' }]} /><Text style={styles.barLabel}></Text></View>
              <View style={styles.barItem}><View style={[styles.bar, styles.barGrey, { height: '55%' }]} /><Text style={styles.barLabel}>2027</Text></View>
              <View style={styles.barItem}><View style={[styles.bar, styles.barGrey, { height: '65%' }]} /><Text style={styles.barLabel}></Text></View>
              <View style={styles.barItem}><View style={[styles.bar, styles.barGrey, { height: '80%' }]} /><Text style={styles.barLabel}>2030</Text></View>
              <View style={styles.barItem}><View style={[styles.bar, styles.barDark, { height: '90%' }]} /><Text style={styles.barLabel}></Text></View>
              <View style={styles.barItem}><View style={[styles.bar, styles.barGreyDark, { height: '95%' }]} /><Text style={styles.barLabel}></Text></View>
              <View style={styles.barItem}><View style={[styles.bar, styles.barGreyDark, { height: '100%' }]} /><Text style={styles.barLabel}>2034</Text></View>
            </View>
          </View>

          {/* Current Market — dynamic from Firestore */}
          <View style={styles.marketCard}>
            <View style={styles.marketIconBg}><Text style={styles.marketIcon}>₹</Text></View>
            <View style={styles.marketInfo}>
              <Text style={styles.marketLabel}>Market Value</Text>
              <Text style={styles.marketPrice}>{propertyPrice}</Text>
            </View>
            <Text style={styles.marketTitle}>CURRENT MARKET</Text>
          </View>

          {/* --- LOAN & EMI OPTIONS CARD --- */}
          <View style={styles.loanCard}>
            <View style={styles.loanHeaderBg} />

            <View style={styles.loanContent}>
              <View style={styles.loanTopRow}>
                <View>
                  <Text style={styles.loanTitle}>Loan & EMI Options</Text>
                  <Text style={styles.loanSub}>Estimate based on ~8.5% interest</Text>
                </View>
                <View style={styles.loanIconCircle}>
                  <Text style={styles.loanIcon}>🏦</Text>
                </View>
              </View>

              <View style={styles.emiContainer}>
                <Text style={styles.emiLabel}>Estimated EMI</Text>
                <View style={styles.emiRow}>
                  <Text style={styles.emiPrice}>₹45,000</Text>
                  <Text style={styles.emiMonth}> / month</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.loanBtn} activeOpacity={0.8}>
                <Text style={styles.loanBtnText}>Get Pre-Approved Options</Text>
                <Text style={styles.loanBtnArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Small Data Cards */}
          <View style={styles.dataCard}>
            <Text style={styles.dataIcon}>📐</Text>
            <View style={styles.dataInfo}>
              <Text style={styles.dataLabel}>Grounds</Text>
              <Text style={styles.dataValue}>{grounds}</Text>
            </View>
            <Text style={styles.dataRightLabel}>LAND SIZE</Text>
          </View>

          <View style={styles.dataCard}>
            <Text style={styles.dataIcon}>📐</Text>
            <View style={styles.dataInfo}>
              <Text style={styles.dataLabel}>Total Area</Text>
              <Text style={styles.dataValue}>{sqft ? `${sqft} Sqft` : '—'}</Text>
            </View>
            <Text style={styles.dataRightLabel}>DIMENSION</Text>
          </View>

          <View style={[styles.dataCard, { marginBottom: 30 }]}>
            <Text style={styles.dataIcon}>🛋️</Text>
            <View style={styles.dataInfo}>
              <Text style={styles.dataLabel}>Asset Type</Text>
              <Text style={styles.dataValue}>{amenity}</Text>
            </View>
          </View>

          {/* Property Description */}
          <View style={styles.contentSection}>
            <View style={styles.descHeaderRow}>
              <Text style={styles.sectionHeader}>Property Description</Text>
              <View style={styles.idBadge}><Text style={styles.idText}>ID: {params.propertyId ? params.propertyId.slice(0, 6).toUpperCase() : '88291'}</Text></View>
            </View>

            <View style={styles.descriptionBlock}>
              <Text style={styles.descriptionText}>
                {description}
              </Text>
            </View>

            {/* Stats Grid — dynamic from Firestore */}
            <View style={styles.statsGrid}>
              {grounds && grounds !== '—' ? (
                <View style={styles.statPill}>
                  <Text style={styles.statLabel}>GROUNDS</Text>
                  <Text style={styles.statVal}>{grounds} Grounds</Text>
                </View>
              ) : null}
              {sqft && sqft !== '—' ? (
                <View style={styles.statPill}>
                  <Text style={styles.statLabel}>TOTAL AREA</Text>
                  <Text style={styles.statVal}>{sqft} Sq.ft</Text>
                </View>
              ) : null}
              {amenity ? (
                <View style={styles.statPill}>
                  <Text style={styles.statLabel}>ASSET TYPE</Text>
                  <Text style={styles.statVal}>{amenity}</Text>
                </View>
              ) : null}
              {(data.district || params.district) ? (
                <View style={styles.statPill}>
                  <Text style={styles.statLabel}>DISTRICT</Text>
                  <Text style={styles.statVal}>{data.district || params.district}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {/* --- KEY FEATURES SECTION --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            {featuresMode === 'paragraph' ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.descriptionText}>
                  {featuresContent || 'No key features listed.'}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12, marginTop: 5 }}>
                {Array.isArray(featuresContent) && featuresContent.length > 0 ? (
                  featuresContent.map((pt: string, idx: number) => (
                    <View key={idx} style={[styles.dataCard, { marginHorizontal: 0, paddingVertical: 12 }]}>
                      <Text style={{ fontSize: 16, marginRight: 10 }}>•</Text>
                      <Text style={{ fontSize: 13, color: '#333', fontWeight: '600', flex: 1 }}>{pt}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>No features listed.</Text>
                )}
              </View>
            )}
          </View>

          {/* --- AVAILABLE OFFERS --- */}
          {(offerCode || bankOffer || partnerOffer) ? (
            <View style={styles.offersContainer}>
              <Text style={styles.sectionHeader}>Available Offers</Text>

              {offerCode ? (
                <View style={styles.offerItem}>
                  <View style={styles.offerDotBg}>
                    <Text style={styles.offerDot}>🏷️</Text>
                  </View>
                  <View style={styles.offerTextContent}>
                    <Text style={styles.offerLabel}>Special Price</Text>
                    <Text style={styles.offerDesc}>{offerValue} with code <Text style={styles.offerBoldText}>{offerCode}</Text></Text>
                    <TouchableOpacity><Text style={styles.tncLink}>T&C</Text></TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {bankOffer ? (
                <View style={styles.offerItem}>
                  <View style={styles.offerDotBg}>
                    <Text style={styles.offerDot}>🏦</Text>
                  </View>
                  <View style={styles.offerTextContent}>
                    <Text style={styles.offerLabel}>Bank Loan Scheme</Text>
                    <Text style={styles.offerDesc}>{bankOffer}</Text>
                    <TouchableOpacity><Text style={styles.tncLink}>T&C</Text></TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {partnerOffer ? (
                <View style={styles.offerItem}>
                  <View style={styles.offerDotBg}>
                    <Text style={styles.offerDot}>🎁</Text>
                  </View>
                  <View style={styles.offerTextContent}>
                    <Text style={styles.offerLabel}>Partner Benefit</Text>
                    <Text style={styles.offerDesc}>{partnerOffer}</Text>
                    <TouchableOpacity><Text style={styles.tncLink}>T&C</Text></TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* --- LEGAL & PROJECT DOCUMENTS --- */}
          {documents && documents.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Legal & Project Documents</Text>
              <View style={{ gap: 10, marginTop: 5 }}>
                {documents.map((doc: { name: string; url: string }, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dataCard, { marginHorizontal: 0, paddingVertical: 15 }]}
                    onPress={() => Linking.openURL(doc.url)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 20, marginRight: 15 }}>📄</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#0B132B' }}>{doc.name}</Text>
                      <Text style={{ fontSize: 10, color: '#DFB15B', marginTop: 2, fontWeight: '700' }}>Tap to view document</Text>
                    </View>
                    <Text style={{ fontSize: 18, color: '#BBB' }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Property Location */}
          <View style={styles.contentSection}>
            <Text style={styles.sectionHeader}>Property Location</Text>
            <View style={[styles.dataCard, { marginHorizontal: 0, paddingVertical: 20, flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: 24, marginRight: 15 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0B132B' }}>View exact location on map</Text>
                  <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{propertyLocation}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#0B132B', width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                onPress={() => {
                  const query = encodeURIComponent(propertyLocation !== 'Location not specified' ? propertyLocation : propertyTitle);
                  Linking.openURL(`https://maps.google.com/?q=${query}`);
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', marginRight: 8 }}>Open in Google Maps</Text>
                <Text style={{ color: '#FFF', fontSize: 14 }}>🧭</Text>
              </TouchableOpacity>

              {locationHighlights ? (
                <View style={{ marginTop: 20, width: '100%', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 15 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0B132B', marginBottom: 8 }}>Nearby Highlights</Text>
                  <Text style={{ fontSize: 13, color: '#555', lineHeight: 20 }}>{locationHighlights}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Value Spike Footer */}
          <View style={styles.valueSpikeCard}>
            <View style={styles.spikeIconBg}><Text style={styles.spikeIcon}>📈</Text></View>
            <View>
              <Text style={styles.spikeTitle}>Heritage Value Spike</Text>
              <Text style={styles.spikeSub}>Appreciation: +14% YoY</Text>
            </View>
            <Text style={styles.spikeInfoIcon}>ℹ️</Text>
          </View>

          {/* Padding for bottom sticky bar */}
          <View style={{ height: 100 + insets.bottom }} />
        </ScrollView>
      )}

      {/* Sticky Bottom Actions */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 15 }]}>
        <TouchableOpacity style={[styles.saveBtn, isSaved && styles.saveBtnActive, { marginRight: 10, width: 50, height: 50 }]} onPress={handleSave}>
          <Text style={styles.saveIcon}>{isSaved ? '❤️' : '♡'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#F0F0F0', marginRight: 10, height: 50 }]} onPress={handleEnquiry}>
          <Text style={[styles.primaryBtnText, { color: '#111' }]}>ENQUIRE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#D4AF37', height: 50 }]} onPress={() => setShowVisitModal(true)}>
          <Text style={styles.primaryBtnText}>SCHEDULE VISIT</Text>
        </TouchableOpacity>
      </View>

      {/* SITE VISIT MODAL */}
      <Modal visible={showVisitModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.visitModalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowVisitModal(false)} />
          <View style={styles.visitModalContent}>
            <View style={styles.visitModalHandle} />
            <Text style={styles.visitModalTitle}>Schedule Site Visit</Text>

            <Text style={styles.visitInputLabel}>SELECT DATE (YYYY-MM-DD)</Text>
            <View style={styles.visitInputRow}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>📅</Text>
              <TextInput
                style={styles.visitTextInput}
                placeholder="e.g. 2026-06-12"
                placeholderTextColor="#999"
                value={visitDate}
                onChangeText={setVisitDate}
              />
            </View>

            <Text style={styles.visitInputLabel}>SELECT TIME</Text>
            <View style={styles.visitTimePills}>
              {['Morning', 'Afternoon', 'Evening'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.visitTimePill, visitTime === time && styles.visitTimePillActive]}
                  onPress={() => setVisitTime(time)}
                >
                  <Text style={[styles.visitTimePillText, visitTime === time && styles.visitTimePillTextActive]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.visitConfirmBtn} onPress={handleScheduleVisit} disabled={isScheduling}>
              {isScheduling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.visitConfirmBtnText}>CONFIRM BOOKING</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* UNIFIED LUXURY CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIcon}>{customAlert.icon}</Text>
            </View>
            <Text style={styles.modalTitle}>{customAlert.title}</Text>
            <Text style={styles.modalSub}>{customAlert.message}</Text>

            <TouchableOpacity style={styles.modalBtn} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
              <Text style={styles.modalBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-screen Image Viewer / Zoom / Swipe */}
      <ImageView
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        FooterComponent={({ imageIndex }) => (
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
              {imageIndex + 1} / {viewerImages.length}
            </Text>
          </View>
        )}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroImageWrapper: {
    width: width * 0.9,
    height: width * 1.1,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featuredListingBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featuredListingText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  galleryContainer: {
    flexDirection: 'row',
    marginTop: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  galleryImageWrapper: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: 15,
    overflow: 'hidden',
    marginHorizontal: 5,
  },
  galleryImageActive: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  moreImagesOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentSection: {
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111',
    lineHeight: 32,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationPin: {
    color: '#666',
    marginRight: 6,
  },
  locationText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  heritageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4E6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heritageIcon: {
    color: '#6B4C1A',
    fontWeight: '900',
    marginRight: 6,
  },
  heritageText: {
    color: '#6B4C1A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chartCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000',
  },
  chartSub: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  chartGrowthBadge: {
    alignItems: 'flex-end',
  },
  growthValue: {
    color: '#27AE60',
    fontWeight: '900',
    fontSize: 15,
  },
  growthLabel: {
    fontSize: 8,
    color: '#888',
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '700',
  },
  chartBars: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barItem: {
    alignItems: 'center',
    width: '10%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 8,
  },
  barGrey: { backgroundColor: '#E0E0E0' },
  barDark: { backgroundColor: '#0B132B' },
  barGreyDark: { backgroundColor: '#6C7A89' },
  barLabel: {
    fontSize: 8,
    color: '#666',
    fontWeight: '600',
    height: 12,
  },
  marketCard: {
    backgroundColor: '#0B132B',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  marketIconBg: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  marketIcon: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  marketInfo: {
    flex: 1,
  },
  marketLabel: {
    color: '#A0AABF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  marketPrice: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  marketTitle: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    position: 'absolute',
    top: 25,
    right: 25,
  },
  loanCard: {
    backgroundColor: '#0B132B',
    marginHorizontal: 25,
    borderRadius: 25,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  loanHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  loanContent: {
    padding: 25,
  },
  loanTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  loanTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  loanSub: {
    color: '#A0AABF',
    fontSize: 11,
    fontWeight: '500',
  },
  loanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  loanIcon: {
    fontSize: 20,
  },
  emiContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emiLabel: {
    color: '#A0AABF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  emiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  emiPrice: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  emiMonth: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
  },
  loanBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 15,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanBtnText: {
    color: '#0B132B',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  loanBtnArrow: {
    color: '#0B132B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dataIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  dataInfo: {
    flex: 1,
  },
  dataLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataValue: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
  },
  dataRightLabel: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 8,
    color: '#888',
    fontWeight: '900',
    letterSpacing: 1,
  },
  descHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  idBadge: {
    backgroundColor: '#F8F4E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  idText: {
    color: '#B8860B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  descriptionBlock: {
    borderLeftWidth: 3,
    borderLeftColor: '#E0AD4D',
    paddingLeft: 15,
    marginBottom: 20,
  },
  descriptionText: {
    lineHeight: 22,
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statPill: {
    width: '48%',
    backgroundColor: '#EEEEEE',
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 8,
    color: '#666',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 11,
    color: '#000',
    fontWeight: '800',
  },
  featureDarkCard: {
    backgroundColor: '#0B132B',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    marginBottom: 15,
  },
  featureGoldIcon: {
    fontSize: 24,
    position: 'absolute',
    top: 25,
    right: 25,
  },
  featureDarkTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  featureDarkSub: {
    color: '#A0AABF',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 20,
  },
  featureLink: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  featureGreyCard: {
    backgroundColor: '#EBEBEB',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    marginBottom: 10,
  },
  section: {
    marginHorizontal: 25,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    lineHeight: 22,
    color: '#555',
    fontWeight: '500',
  },
  featureDarkIcon: {
    fontSize: 24,
    position: 'absolute',
    top: 25,
    right: 25,
  },
  featureGreyTitle: {
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  featureGreySub: {
    color: '#555',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 20,
  },
  featurePillsRow: {
    flexDirection: 'row',
  },
  featurePill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  fPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  mapCard: {
    marginTop: 15,
    width: '100%',
    height: 250,
    borderRadius: 25,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  mapPinCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  mapPinDarkIcon: {
    backgroundColor: '#F5E2B2',
    padding: 10,
    borderRadius: 15,
    marginRight: 15,
  },
  mapPinTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
  mapPinSub: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  mapActionsRow: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mapActionBtnDark: {
    backgroundColor: '#0B132B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  mapActionTextWhite: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  mapActionBtnLight: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mapActionTextDark: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  valueSpikeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 25,
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
  },
  spikeIconBg: {
    backgroundColor: '#D1F2EB',
    padding: 10,
    borderRadius: 15,
    marginRight: 15,
  },
  spikeIcon: {
    fontSize: 16,
  },
  spikeTitle: {
    fontWeight: '900',
    fontSize: 12,
    color: '#111',
  },
  spikeSub: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  spikeInfoIcon: {
    position: 'absolute',
    right: 20,
    color: '#999',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  saveBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  saveBtnActive: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  saveIcon: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold',
  },
  saveText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#666',
    marginTop: 2,
  },
  saveTextActive: {
    color: '#E74C3C',
  },
  primaryBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#0B132B',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  primaryBtnIcon: {
    color: '#D4AF37',
    fontSize: 14,
    marginRight: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 35,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0B132B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  successIcon: {
    fontSize: 42,
    color: '#D4AF37',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111',
    marginBottom: 15,
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 35,
  },
  modalBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  videoPlayerPlaceholder: {
    height: 200,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
    marginTop: 10,
  },
  placeholderImg: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  playIcon: {
    fontSize: 24,
    color: '#0B132B',
    marginLeft: 4,
  },
  playText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  offersContainer: {
    paddingHorizontal: 25,
    marginBottom: 30,
  },
  offerItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  offerDotBg: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  offerDot: {
    fontSize: 16,
  },
  offerTextContent: {
    flex: 1,
  },
  offerLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  offerDesc: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
    fontWeight: '500',
  },
  offerBoldText: {
    fontWeight: '900',
    color: '#000',
  },
  tncLink: {
    color: '#0D6EFD',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  visitModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  visitModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30 },
  visitModalHandle: { width: 40, height: 5, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  visitModalTitle: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 25 },
  visitInputLabel: { fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 1, marginBottom: 10 },
  visitInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 15, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: '#EEE' },
  visitTextInput: { flex: 1, height: 50, fontSize: 14, fontWeight: '700', color: '#111' },
  visitTimePills: { flexDirection: 'row', gap: 10, marginBottom: 35 },
  visitTimePill: { flex: 1, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  visitTimePillActive: { backgroundColor: '#0B132B', borderColor: '#0B132B' },
  visitTimePillText: { fontSize: 12, fontWeight: '800', color: '#555' },
  visitTimePillTextActive: { color: '#FFF' },
  visitConfirmBtn: { backgroundColor: '#D4AF37', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  visitConfirmBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});

export default PropertyDetailsScreen;
