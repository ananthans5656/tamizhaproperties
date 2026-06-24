import React from 'react';
import { api, normalizeImageUrl } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  Share,
  TextInput,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';

const Checkbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <TouchableOpacity
    style={styles.checkboxRow}
    onPress={() => onChange(!checked)}
    activeOpacity={0.7}
  >
    <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
      {checked && <Text style={styles.checkboxTick}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const { width } = Dimensions.get('window');
const GOLD = '#C9A84C';

type Props = {
  navigation: any,
  route: {
    params: {
      property: any;
      fromScreen?: string;
      lead?: any;
    };
  };
  isDark?: boolean;
};

const PropertyDetailScreen = ({ navigation, route, isDark = false }: Props) => {
  const { property: initialProperty } = route.params || { property: { name: 'Property Details', description: 'No details available.', price: '₹0', image: 'https://images.unsplash.com/photo-1600585154340-be6199f7d009' } };

  const [property, setProperty] = React.useState(initialProperty);
  const [activeImage, setActiveImage] = React.useState(normalizeImageUrl(property.image || ''));
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [galleryVisible, setGalleryVisible] = React.useState(false);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [videoVisible, setVideoVisible] = React.useState(false);
  const [uploadingVideo, setUploadingVideo] = React.useState(false);

  // Edit Form State
  const [tempPrice, setTempPrice] = React.useState(property.price);
  const [tempName, setTempName] = React.useState(property.name || property.title);
  const [tempDescription, setTempDescription] = React.useState(property.description || '');
  const [tempVideoUrl, setTempVideoUrl] = React.useState(property.videoUrl || '');
  const [tempOfferCode, setTempOfferCode] = React.useState(property.offerCode || '');
  const [tempOfferValue, setTempOfferValue] = React.useState(property.offerValue || '');
  const [tempBankOffer, setTempBankOffer] = React.useState(property.bankOffer || '');
  const [tempPartnerOffer, setTempPartnerOffer] = React.useState(property.partnerOffer || '');
  const [tempReraVerified, setTempReraVerified] = React.useState(property.isReraVerified ?? true);
  const [tempActiveAsset, setTempActiveAsset] = React.useState(property.isActiveAsset ?? true);
  const [tempPrimeAsset, setTempPrimeAsset] = React.useState(property.isPrimeAsset ?? false);
  const [tempNegotiable, setTempNegotiable] = React.useState(property.isNegotiable ?? false);
  const [tempSqft, setTempSqft] = React.useState(property.sqft?.toString() || '');
  const [tempGrounds, setTempGrounds] = React.useState(property.grounds || '');
  const [tempAmenity, setTempAmenity] = React.useState(property.amenity || '');
  const [customAlert, setCustomAlert] = React.useState({
    visible: false,
    title: '',
    message: '',
    icon: '✅',
  });

  const gallery = React.useMemo(() => {
    const list: string[] = [];
    // Collect from images array (normalized)
    if (Array.isArray(property.images) && property.images.length > 0) {
      property.images.forEach((url: string) => {
        const n = normalizeImageUrl(url);
        if (n && !list.includes(n)) list.push(n);
      });
    } else if (property.image) {
      const n = normalizeImageUrl(property.image);
      if (n) list.push(n);
    }
    if (Array.isArray(property.gallery) && property.gallery.length > 0) {
      property.gallery.forEach((url: string) => {
        const n = normalizeImageUrl(url);
        if (n && !list.includes(n)) list.push(n);
      });
    }
    return list;
  }, [property.image, property.images, property.gallery]);

  const onShare = async () => {
    const priceFormatted = property.price
      ? `₹${Number(property.price).toLocaleString('en-IN')}`
      : '';
    const area = property.ground
      ? `${property.ground} Grounds`
      : property.sqft
      ? `${property.sqft} sqft`
      : '';
    const msg = [
      `🏡 *${property.name || property.title || 'Property'}*`,
      property.location ? `📍 ${property.location}${property.district ? ', ' + property.district : ''}` : '',
      priceFormatted ? `💰 ${priceFormatted}` : '',
      area ? `📐 ${area}` : '',
      property.plot_type || property.plotType ? `🏷️ ${property.plot_type || property.plotType}` : '',
      property.description ? `\n${property.description}` : '',
      `\n📞 Contact Tamizha Properties: +91 93617 77733`,
    ].filter(Boolean).join('\n');
    try {
      await Share.share({ message: msg });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'video', videoQuality: 'medium' });
      if (result.assets && result.assets[0]?.uri) {
        setTempVideoUrl(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Video pick error:', err);
    }
  };

  const handleUpdate = async () => {
    setIsProcessing(true);
    try {
      await api.updateProperty(property.id, {
        title: tempName,
        price: tempPrice,
        description: tempDescription,
        location: property.location || '',
        type: property.type || '',
        status: property.status || '',
        images: property.images || (property.image ? [property.image] : []),
      });
      setProperty({
        ...property,
        title: tempName,
        name: tempName,
        price: tempPrice,
        description: tempDescription,
        videoUrl: tempVideoUrl,
        offerCode: tempOfferCode,
        offerValue: tempOfferValue,
        bankOffer: tempBankOffer,
        partnerOffer: tempPartnerOffer,
        isReraVerified: tempReraVerified,
        isActiveAsset: tempActiveAsset,
        isPrimeAsset: tempPrimeAsset,
        isNegotiable: tempNegotiable,
        sqft: tempSqft ? Number(tempSqft) : '',
        grounds: tempGrounds,
        amenity: tempAmenity,
      });
      setEditModalVisible(false);
      setCustomAlert({
        visible: true,
        title: 'Asset Updated',
        message: 'Changes synchronized successfully across the network.',
        icon: '✅',
      });
    } catch (e: any) {
      setCustomAlert({
        visible: true,
        title: 'Update Failed',
        message: e.message,
        icon: '❌',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleHide = async () => {
    setIsProcessing(true);
    try {
      const newHidden = !property.hidden;
      await api.updateProperty(property.id, {
        title: property.title || property.name || '',
        price: property.price || '',
        description: property.description || '',
        location: property.location || '',
        type: property.type || '',
        status: newHidden ? 'hidden' : (property.status || 'available'),
        images: property.images || (property.image ? [property.image] : []),
      });
      setProperty({
        ...property,
        hidden: newHidden,
      });
      setCustomAlert({
        visible: true,
        title: newHidden ? 'Asset Hidden' : 'Asset Visible',
        message: newHidden ? 'Property is now hidden from the public marketplace.' : 'Property is now visible on the public marketplace.',
        icon: newHidden ? '🔒' : '🔓',
      });
    } catch (e: any) {
      setCustomAlert({
        visible: true,
        title: 'Operation Failed',
        message: e.message,
        icon: '❌',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePortfolioImage = async (imgUrl: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this photo from the property portfolio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              let updatedCover = property.image;
              let updatedGallery = Array.isArray(property.gallery) ? [...property.gallery] : [];

              if (imgUrl === property.image) {
                // Deleting main cover
                if (updatedGallery.length > 0) {
                  // Promote first gallery image to cover
                  updatedCover = updatedGallery[0];
                  updatedGallery.shift(); // remove promoted image
                } else {
                  Alert.alert('Cannot Delete', 'Property must have at least one photo.');
                  setIsProcessing(false);
                  return;
                }
              } else {
                // Deleting secondary gallery image
                updatedGallery = updatedGallery.filter(url => url !== imgUrl);
              }

              const updatedImages = [updatedCover, ...updatedGallery];
              await api.updateProperty(property.id, {
                title: property.title || property.name || '',
                price: property.price || '',
                description: property.description || '',
                location: property.location || '',
                type: property.type || '',
                status: property.status || '',
                images: updatedImages,
              });

              // Update local state
              const updatedProp = {
                ...property,
                image: updatedCover,
                gallery: updatedGallery,
              };
              setProperty(updatedProp);
              
              // If we deleted the active main display image, reset active display image
              if (activeImage === imgUrl) {
                setActiveImage(updatedCover);
              }

              Alert.alert('Deleted', 'Image removed from property successfully. ✅');
            } catch (e: any) {
              Alert.alert('Delete Failed', e.message || 'Could not delete image.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteDocument = async (docUrl: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document from the property records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              let updatedDocs = Array.isArray(property.documents) ? [...property.documents] : [];
              updatedDocs = updatedDocs.filter((doc: any) => doc.url !== docUrl);

              // documents field not in current DB schema — update local state only
              console.log('Document deleted from local state; DB schema update pending.');

              // Update local state
              setProperty({
                ...property,
                documents: updatedDocs,
              });

              Alert.alert('Deleted', 'Document removed successfully. ✅');
            } catch (e: any) {
              Alert.alert('Delete Failed', e.message || 'Could not delete document.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleEnquiry = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigation.navigate('Leads');
    }, 1200);
  };

  const theme = {
    background: isDark ? '#0B0F19' : '#F8FAFC',
    cardBg: isDark ? '#111827' : '#FFF',
    text: isDark ? '#F9FAFB' : '#111',
    subText: isDark ? '#9CA3AF' : '#666',
    border: isDark ? '#1F2937' : '#E2E8F0',
    contentBodyBg: isDark ? '#111827' : '#FFF',
    statLabelColor: isDark ? '#9CA3AF' : '#666',
    statValueColor: isDark ? '#F9FAFB' : '#111',
    dividerColor: isDark ? '#1F2937' : '#E0E0E0',
    descriptionColor: isDark ? '#D1D5DB' : '#555',
    specItemBg: isDark ? '#1F2937' : '#F8FAFC',
    specValueColor: isDark ? '#F9FAFB' : '#111',
    specLabelColor: isDark ? '#9CA3AF' : '#666',
    offerBoxBg: isDark ? '#1F2937' : '#F9F9FB',
    offerBoxBorder: isDark ? '#374151' : '#EAEAEA',
    offerTitleColor: isDark ? '#F9FAFB' : '#111',
    actionBtnText: '#FFF',
    actionBtnBg: isDark ? GOLD : '#111',
    hideBtnBg: isDark ? '#1F2937' : '#F1F5F9',
    hideBtnBorder: isDark ? '#374151' : '#E2E8F0',
    hideBtnText: isDark ? '#F9FAFB' : '#111',
    modalBg: isDark ? '#111827' : '#FFF',
    modalHandle: isDark ? '#374151' : '#DDD',
    modalTitle: isDark ? '#F9FAFB' : '#111',
    inputText: isDark ? '#FFF' : '#111',
    inputBg: isDark ? '#1F2937' : '#F8FAFC',
    inputBorder: isDark ? '#374151' : '#E2E8F0',
    inputLabel: GOLD,
    statusBadgeBg: isDark ? '#3E3213' : '#FEF3C7',
    statusBadgeText: isDark ? GOLD : '#B45309',
    checkboxLabelColor: isDark ? '#F9FAFB' : '#1E293B',
    checkboxBoxBorder: isDark ? '#374151' : '#CBD5E1',
    navHeaderBg: isDark ? '#0B0F19' : '#FFF',
  };

  const CheckboxLocal = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={() => onChange(!checked)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkboxBox, { backgroundColor: theme.inputBg, borderColor: theme.checkboxBoxBorder }, checked && styles.checkboxBoxChecked]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <Text style={[styles.checkboxLabel, { color: theme.checkboxLabelColor }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: activeImage }} style={styles.headerImage} />
          <View style={styles.overlay} />

          <View style={styles.imageHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
              <Text style={{fontSize: 20}}>📤</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageFooter}>
            <Text style={styles.propName}>{property.name}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.contentBody, { backgroundColor: theme.contentBodyBg }]}>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 15, flexWrap: 'wrap'}}>
                {property.isActiveAsset !== false && (
                  <View style={[styles.statusBadge, { backgroundColor: theme.statusBadgeBg }]}>
                    <Text style={[styles.statusText, { color: theme.statusBadgeText }]}>ACTIVE ASSET</Text>
                  </View>
                )}
                {property.isReraVerified !== false && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedTxt}>✓ RERA VERIFIED</Text>
                  </View>
                )}
                {property.isPrimeAsset && (
                  <View style={[styles.statusBadge, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.statusText}>⚡ PRIME ASSET</Text>
                  </View>
                )}
                {property.isNegotiable && (
                  <View style={[styles.statusBadge, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.statusText}>🤝 NEGOTIABLE</Text>
                  </View>
                )}
            </View>
           <View style={styles.statsRow}>
              <View style={{flex: 1}}>
                 <Text style={[styles.statLabel, { color: theme.statLabelColor }]}>MARKET VALUE</Text>
                 <Text style={[styles.statValue, { color: theme.statValueColor }]}>{property.price}</Text>
              </View>
              <View style={[styles.verticalDivider, { backgroundColor: theme.dividerColor }]} />
              <View style={{flex: 1}}>
                 <Text style={[styles.statLabel, { color: theme.statLabelColor }]}>STATUS</Text>
                 <Text style={[styles.statValue, { color: '#4CAF50' }]}>Available</Text>
              </View>
           </View>

           {/* Gallery Summary */}
           <View style={styles.galleryStrip}>
              {gallery.slice(0, 2).map((img, index) => (
                <TouchableOpacity
                   key={index}
                   style={[styles.galleryThumb, activeImage === img && styles.activeThumb]}
                   onPress={() => setActiveImage(img)}>
                   <Image source={{ uri: img }} style={styles.thumbImg} />
                </TouchableOpacity>
              ))}
              {gallery.length > 2 && (
                <TouchableOpacity style={[styles.moreThumb, { backgroundColor: theme.specItemBg }]} onPress={() => setGalleryVisible(true)}>
                   <Text style={[styles.moreTxt, { color: theme.text }]}>+{gallery.length - 2}</Text>
                </TouchableOpacity>
              )}
           </View>

           <Text style={[styles.sectionTitle, { color: theme.text }]}>Asset Overview</Text>
           <Text style={[styles.description, { color: theme.descriptionColor }]}>{property.description || 'No description provided for this luxury asset.'}</Text>

           <Text style={[styles.sectionTitle, { color: theme.text }]}>Specifications</Text>
           <View style={styles.specGrid}>
              <View style={[styles.specItem, { backgroundColor: theme.specItemBg }]}><Text style={styles.specIcon}>📐</Text><View><Text style={[styles.specLabel, { color: theme.specLabelColor }]}>Area</Text><Text style={[styles.specVal, { color: theme.text }]}>{property.sqft ? `${property.sqft} Sq.ft` : '—'}</Text></View></View>
              <View style={[styles.specItem, { backgroundColor: theme.specItemBg }]}><Text style={styles.specIcon}>🌳</Text><View><Text style={[styles.specLabel, { color: theme.specLabelColor }]}>Size</Text><Text style={[styles.specVal, { color: theme.text }]}>{property.grounds ? `${property.grounds}` : '—'}</Text></View></View>
              <View style={[styles.specItem, { backgroundColor: theme.specItemBg }]}><Text style={styles.specIcon}>🛋️</Text><View><Text style={[styles.specLabel, { color: theme.specLabelColor }]}>Type</Text><Text style={[styles.specVal, { color: theme.text }]}>{property.amenity || 'Standard'}</Text></View></View>
           </View>

           {/* Dynamic Key Features */}
           {property.featuresContent ? (
              <View style={{ marginBottom: 20 }}>
                 <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Features</Text>
                 {property.featuresMode === 'paragraph' ? (
                    <Text style={[styles.description, { color: theme.descriptionColor }]}>
                       {property.featuresContent}
                    </Text>
                 ) : (
                    <View style={{ gap: 8, paddingHorizontal: 10 }}>
                       {Array.isArray(property.featuresContent) && property.featuresContent.map((pt: string, idx: number) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                             <Text style={{ color: GOLD, fontSize: 14 }}>•</Text>
                             <Text style={{ color: theme.descriptionColor, fontSize: 14, fontWeight: '600' }}>{pt}</Text>
                          </View>
                       ))}
                    </View>
                 )}
              </View>
           ) : null}

            {/* Exclusive Offers Section */}
            {(property.offerCode || property.offerValue || property.bankOffer || property.partnerOffer) ? (
               <View style={{ marginBottom: 20 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>🎁 Exclusive Offers & Schemes</Text>
                  
                  {/* Offer Code & Value */}
                  {(property.offerCode || property.offerValue) ? (
                     <View style={[styles.offerCard, { backgroundColor: theme.offerBoxBg, borderColor: GOLD, borderStyle: 'dashed' }]}>
                        <Text style={{ fontSize: 24, marginRight: 12 }}>🎟️</Text>
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.offerLabel, { color: GOLD }]}>PROMO DISCOUNT</Text>
                           {property.offerCode ? (
                              <Text style={[styles.offerCodeText, { color: theme.text }]}>Code: {property.offerCode}</Text>
                           ) : null}
                           {property.offerValue ? (
                              <Text style={[styles.offerValText, { color: theme.subText }]}>{property.offerValue}</Text>
                           ) : null}
                        </View>
                     </View>
                  ) : null}

                  {/* Bank Loan Scheme */}
                  {property.bankOffer ? (
                     <View style={[styles.offerCard, { backgroundColor: theme.offerBoxBg, borderColor: theme.border }]}>
                        <Text style={{ fontSize: 24, marginRight: 12 }}>🏦</Text>
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.offerLabel, { color: '#0284C7' }]}>BANK LOAN SCHEME</Text>
                           <Text style={[styles.offerValText, { color: theme.text }]}>{property.bankOffer}</Text>
                        </View>
                     </View>
                  ) : null}

                  {/* Partner / Developer Offer */}
                  {property.partnerOffer ? (
                     <View style={[styles.offerCard, { backgroundColor: theme.offerBoxBg, borderColor: theme.border }]}>
                        <Text style={{ fontSize: 24, marginRight: 12 }}>🤝</Text>
                        <View style={{ flex: 1 }}>
                           <Text style={[styles.offerLabel, { color: '#16A34A' }]}>PARTNER BENEFIT</Text>
                           <Text style={[styles.offerValText, { color: theme.text }]}>{property.partnerOffer}</Text>
                        </View>
                     </View>
                  ) : null}
               </View>
            ) : null}

           {/* Legal & Project Documents */}
           {Array.isArray(property.documents) && property.documents.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                 <Text style={[styles.sectionTitle, { color: theme.text }]}>📄 Legal & Project Documents</Text>
                 <View style={{ gap: 10, marginTop: 5 }}>
                    {property.documents.map((doc: { name: string; url: string }, idx: number) => (
                       <View key={idx} style={[styles.specItem, { backgroundColor: theme.specItemBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                             <Text style={{ fontSize: 24 }}>📄</Text>
                             <View style={{ flex: 1 }}>
                                <Text style={[styles.specVal, { color: theme.text }]} numberOfLines={1}>{doc.name}</Text>
                                <Text style={[styles.specLabel, { color: theme.specLabelColor }]} numberOfLines={1}>Verification Document</Text>
                             </View>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                             <TouchableOpacity 
                                style={{ backgroundColor: GOLD, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                                onPress={() => {
                                   if (doc.url) {
                                      Linking.openURL(doc.url).catch(() => {
                                         Alert.alert('Error', 'Unable to open document link.');
                                      });
                                   } else {
                                      Alert.alert('Unavailable', 'Document link is not available.');
                                   }
                                }}
                             >
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>DOWNLOAD</Text>
                             </TouchableOpacity>
                             <TouchableOpacity 
                                style={{ backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                                onPress={() => handleDeleteDocument(doc.url)}
                             >
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>✕</Text>
                             </TouchableOpacity>
                          </View>
                       </View>
                    ))}
                 </View>
              </View>
           ) : null}

           {/* Admin Controls */}
           <Text style={[styles.adminTitle, { color: theme.subText }]}>Admin Controls</Text>
           <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.specItemBg }]} onPress={() => {
                 setTempName(property.title || property.name);
                 setTempPrice(property.price);
                 setTempDescription(property.description || '');
                 setTempVideoUrl(property.videoUrl || '');
                 setTempOfferCode(property.offerCode || '');
                 setTempOfferValue(property.offerValue || '');
                 setTempBankOffer(property.bankOffer || '');
                 setTempPartnerOffer(property.partnerOffer || '');
                 setTempReraVerified(property.isReraVerified ?? true);
                 setTempActiveAsset(property.isActiveAsset ?? true);
                 setTempPrimeAsset(property.isPrimeAsset ?? false);
                 setTempNegotiable(property.isNegotiable ?? false);
                 setTempSqft(property.sqft?.toString() || '');
                 setTempGrounds(property.grounds || '');
                 setTempAmenity(property.amenity || '');
                 setEditModalVisible(true);
              }}>
                 <Text style={styles.actionIcon}>📝</Text>
                 <Text style={[styles.actionLabel, { color: theme.text }]}>Edit Info</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.specItemBg }]} onPress={() => setVideoVisible(true)}>
                 <Text style={styles.actionIcon}>🎥</Text>
                 <Text style={[styles.actionLabel, { color: theme.text }]}>Video Tour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, property.hidden ? { backgroundColor: isDark ? '#1C3A27' : '#F0FDF4' } : { backgroundColor: isDark ? '#4A1D1D' : '#FFF1F1' }]}
                onPress={handleToggleHide}>
                  <Text style={{fontSize: 20}}>{property.hidden ? '👁️' : '👁‍🗨'}</Text>
                  <Text style={[styles.actionLabel, property.hidden ? { color: '#16A34A' } : { color: '#EF4444' }]}>
                    {property.hidden ? 'Show Web' : 'Hide Web'}
                  </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: isDark ? '#2E2211' : '#FEFCE8', borderWidth: 1, borderColor: isDark ? '#B45309' : '#FDE68A' }]}
                onPress={() => navigation.navigate('SiteVisits', { preselectProperty: property })}
              >
                  <Text style={{ fontSize: 20 }}>📅</Text>
                  <Text style={[styles.actionLabel, { color: isDark ? GOLD : '#92400E' }]}>Schedule Visit</Text>
              </TouchableOpacity>
           </View>

           <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
         <View>
            <Text style={[styles.priceLabel, { color: theme.subText }]}>ASKING PRICE</Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>{property.price}</Text>
         </View>
         <TouchableOpacity style={[styles.manageBtn, { backgroundColor: theme.actionBtnBg }]} onPress={handleEnquiry}>
            <Text style={[styles.manageBtnText, { color: theme.actionBtnText }]}>{isProcessing ? 'SYNCING...' : 'MANAGE ENQUIRIES'}</Text>
         </TouchableOpacity>
      </View>

      {/* MODALS */}
      <Modal visible={videoVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={[styles.videoPopup, { backgroundColor: theme.modalBg }]}>
                  <Text style={[styles.modalTitle, { color: theme.modalTitle }]}>🎥 Property Video Tour</Text>
                  
                  {property.videoUrl ? (
                    <View style={styles.videoContainer}>
                      <TouchableOpacity 
                        style={[styles.videoPlaceholder, { borderColor: theme.border }]} 
                        onPress={() => Linking.openURL(property.videoUrl)}
                        activeOpacity={0.9}
                      >
                        <Image 
                          source={{ uri: property.image || 'https://images.unsplash.com/photo-1600585154340-be6199f7d009' }} 
                          style={styles.videoPoster} 
                        />
                        <View style={styles.playBtnOverlay}>
                          <Text style={styles.playIcon}>▶</Text>
                        </View>
                      </TouchableOpacity>
                      <Text style={[styles.videoHint, { color: theme.subText }]}>Tap on the player above to watch the walkthrough tour video.</Text>
                      <TouchableOpacity 
                        style={[styles.updateBtn, { backgroundColor: GOLD, marginTop: 15, width: '100%' }]} 
                        onPress={() => Linking.openURL(property.videoUrl)}
                      >
                        <Text style={[styles.updateBtnText, { color: '#FFF' }]}>WATCH WALKTHROUGH</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <Text style={styles.noVideoIcon}>📭</Text>
                      <Text style={[styles.noVideoTitle, { color: theme.text }]}>No Video Walkthrough Yet</Text>
                      <Text style={[styles.noVideoSub, { color: theme.subText }]}>You can add a YouTube, Google Drive or walkthrough link under 'Edit Info' to let leads see a real-time site tour.</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity style={[styles.closeBtn, { marginTop: 15, width: '100%', backgroundColor: theme.actionBtnBg }]} onPress={() => setVideoVisible(false)}>
                      <Text style={[styles.closeBtnText, { color: theme.actionBtnText }]}>CLOSE</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* CUSTOM ALERT MODAL */}
      <Modal visible={customAlert.visible} transparent animationType="fade">
          <View style={styles.mOverlay}>
              <View style={[styles.mCard, { backgroundColor: theme.modalBg }]}>
                  <Text style={styles.mIcon}>{customAlert.icon}</Text>
                  <Text style={[styles.mTitle, { color: theme.text }]}>{customAlert.title}</Text>
                  <Text style={[styles.mMsg, { color: theme.subText }]}>{customAlert.message}</Text>
                  <TouchableOpacity style={styles.mBtn} onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}>
                      <Text style={styles.mBtnT}>OK</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.navHeaderBg, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ padding: 4 }}>
                      <Text style={{ fontSize: 22, color: theme.text }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: theme.text }}>Edit Property</Text>
                  <TouchableOpacity onPress={handleUpdate} style={{ backgroundColor: GOLD, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 }}>
                      {isProcessing ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>SAVE</Text>}
                  </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                  <Text style={styles.inputLabel}>PROPERTY TITLE</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempName} onChangeText={setTempName} placeholder="Name" />

                  <Text style={styles.inputLabel}>PRICE / VALUATION</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempPrice} onChangeText={setTempPrice} placeholder="Price" />

                  <Text style={styles.inputLabel}>DESCRIPTION</Text>
                  <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top', backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempDescription} onChangeText={setTempDescription} placeholder="Enter property overview description..." multiline numberOfLines={4} />

                  <Text style={styles.inputLabel}>AREA (SQ.FT)</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempSqft} onChangeText={setTempSqft} placeholder="Sqft Area" keyboardType="numeric" />

                  <Text style={styles.inputLabel}>SIZE (GROUNDS)</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempGrounds} onChangeText={setTempGrounds} placeholder="e.g. 1.5 Grounds" />

                  <Text style={styles.inputLabel}>ASSET TYPE / AMENITY</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempAmenity} onChangeText={setTempAmenity} placeholder="e.g. RERA Approved" />

                  <Text style={styles.inputLabel}>WALKTHROUGH VIDEO</Text>
                  {tempVideoUrl ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: GOLD, padding: 12, marginBottom: 10 }}>
                          <Text style={{ flex: 1, color: GOLD, fontSize: 11, fontWeight: '700' }} numberOfLines={2}>{tempVideoUrl}</Text>
                          <TouchableOpacity onPress={() => setTempVideoUrl('')} style={{ marginLeft: 10 }}>
                              <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 16 }}>✕</Text>
                          </TouchableOpacity>
                      </View>
                  ) : null}
                  <TouchableOpacity
                      style={{ backgroundColor: theme.inputBg, borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}
                      onPress={pickVideo}
                      disabled={uploadingVideo}
                  >
                      {uploadingVideo
                          ? <><ActivityIndicator color={GOLD} size="small" /><Text style={{ color: GOLD, fontWeight: '700', fontSize: 13 }}>Uploading...</Text></>
                          : <><Text style={{ fontSize: 20 }}>📹</Text><Text style={{ color: theme.subText, fontWeight: '700', fontSize: 13 }}>Choose Video from Gallery</Text></>
                      }
                  </TouchableOpacity>

                  <Text style={styles.inputLabel}>OFFER CODE</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempOfferCode} onChangeText={setTempOfferCode} placeholder="Offer Code (Special Price)" />

                  <Text style={styles.inputLabel}>OFFER VALUE</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempOfferValue} onChangeText={setTempOfferValue} placeholder="Offer Value" />

                  <Text style={styles.inputLabel}>BANK OFFER</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempBankOffer} onChangeText={setTempBankOffer} placeholder="Bank Offer" />

                  <Text style={styles.inputLabel}>PARTNER OFFER</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} value={tempPartnerOffer} onChangeText={setTempPartnerOffer} placeholder="Partner Offer" />

                  <Text style={styles.inputLabel}>FEATURE BADGES</Text>
                  <CheckboxLocal label="Active Asset" checked={tempActiveAsset} onChange={setTempActiveAsset} />
                  <CheckboxLocal label="RERA Verified" checked={tempReraVerified} onChange={setTempReraVerified} />
                  <CheckboxLocal label="Prime Asset" checked={tempPrimeAsset} onChange={setTempPrimeAsset} />
                  <CheckboxLocal label="Negotiable Price" checked={tempNegotiable} onChange={setTempNegotiable} />
              </ScrollView>
          </SafeAreaView>
      </Modal>

      <Modal visible={galleryVisible} animationType="slide">
          <SafeAreaView style={{flex: 1, backgroundColor: theme.background }}>
              <View style={[styles.modalHeader, { backgroundColor: theme.navHeaderBg, borderBottomColor: theme.border }]}>
                  <TouchableOpacity style={styles.backButtonRow} onPress={() => setGalleryVisible(false)}>
                      <Text style={styles.backBtnText}>←</Text>
                      <Text style={[styles.backBtnLabel, { color: theme.subText }]}>Back to Property</Text>
                  </TouchableOpacity>
                  <Text style={[styles.portfolioTitle, { color: theme.text }]}>Asset Portfolio</Text>
              </View>
              <FlatList
                data={gallery}
                numColumns={2}
                contentContainerStyle={{ padding: 10 }}
                renderItem={({item}) => (
                  <View style={styles.gridImgWrapper}>
                    <Image source={{uri: item}} style={styles.gridImg} />
                    <TouchableOpacity 
                      style={styles.deleteOverlayBtn} 
                      onPress={() => handleDeletePortfolioImage(item)}
                    >
                      <Text style={styles.deleteOverlayIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
          </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 20 },
  imageContainer: { height: 350, width: '100%', position: 'relative' },
  headerImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  imageHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: '#FFF', fontSize: 24 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  imageFooter: { position: 'absolute', bottom: 20, left: 20 },
  statusBadge: { backgroundColor: GOLD, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  verifiedBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  verifiedTxt: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  propName: { 
    color: '#FFF', 
    fontSize: 30, 
    fontWeight: 'bold', 
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  contentBody: { padding: 20, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -25 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statLabel: { fontSize: 10, color: '#AAA', fontWeight: '800' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#111' },
  verticalDivider: { width: 1, height: 30, backgroundColor: '#EEE', marginHorizontal: 20 },
  galleryStrip: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  galleryThumb: { width: 60, height: 60, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  activeThumb: { borderColor: GOLD, borderWidth: 2 },
  thumbImg: { width: '100%', height: '100%' },
  moreThumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  moreTxt: { fontSize: 12, fontWeight: '900', color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 10, marginTop: 10 },
  description: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
  specGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  specItem: { flex: 1, backgroundColor: '#F9F9F9', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  specIcon: { fontSize: 20 },
  specLabel: { fontSize: 10, color: '#AAA' },
  specVal: { fontSize: 12, fontWeight: '800' },
  adminTitle: { fontSize: 12, color: '#AAA', fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, backgroundColor: '#F5F5F5', padding: 15, borderRadius: 15, alignItems: 'center', gap: 5 },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 10, fontWeight: '800', color: '#444' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  priceLabel: { fontSize: 9, color: '#AAA', fontWeight: '900' },
  priceValue: { fontSize: 20, fontWeight: '900', color: '#111' },
  manageBtn: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  manageBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 15 },
  closeBtn: { backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  editCard: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 25, maxHeight: '85%' },
  inputLabel: { fontSize: 9, fontWeight: '900', color: GOLD, letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginBottom: 15, fontWeight: '700', color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
  updateBtn: { backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  updateBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFF' },
  backButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtnText: { fontSize: 24, fontWeight: '900', color: GOLD },
  backBtnLabel: { fontSize: 14, fontWeight: '700', color: '#475569' },
  portfolioTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  gridImgWrapper: { position: 'relative', margin: 5, width: width / 2 - 15, height: 150, borderRadius: 10, overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%' },
  deleteOverlayBtn: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(239, 68, 68, 0.95)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  deleteOverlayIcon: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  // Custom Alert Popups
  mOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  mCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 35, alignItems: 'center', width: '85%' },
  mIcon: { fontSize: 50, marginBottom: 15 },
  mTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  mMsg: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 18 },
  mBtn: { backgroundColor: GOLD, width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mBtnT: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  
  // Custom Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 10 },
  checkboxBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  checkboxBoxChecked: { borderColor: GOLD, backgroundColor: GOLD },
  checkboxTick: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  checkboxLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B' },

  // Video Popup
  videoPopup: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
  videoContainer: { width: '100%', alignItems: 'center' },
  videoPlaceholder: { width: '100%', height: 160, borderRadius: 15, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#E2E8F0' },
  videoPoster: { width: '100%', height: '100%', opacity: 0.8 },
  playBtnOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 24, color: '#FFF', backgroundColor: GOLD, width: 50, height: 50, borderRadius: 25, textAlign: 'center', lineHeight: 48, overflow: 'hidden', paddingLeft: 4, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  videoHint: { fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 10, fontWeight: '700' },
  noVideoIcon: { fontSize: 45, marginBottom: 12 },
  noVideoTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
  noVideoSub: { fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 18 },

  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 12,
  },
  offerLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  offerCodeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offerValText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
});

export default PropertyDetailScreen;
