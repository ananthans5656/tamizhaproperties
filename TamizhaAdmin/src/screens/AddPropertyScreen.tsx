import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { api } from '../services/api';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

const GOLD = '#C9A84C';

const DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
  'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai',
  'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
  'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupattur', 'Tiruvallur', 'Tiruvannamalai',
  'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar', 'Nagercoil', 'Malaysia',
];
const STATUS_OPTIONS = ['For Sale', 'Premium', 'New Launch', 'Sold', 'Draft'];
const PLOT_TYPE_OPTIONS = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];
const AVAILABLE_AMENITIES = [
  { label: 'Compound Wall', emoji: '🧱' },
  { label: 'Street Lighting', emoji: '💡' },
  { label: '24/7 Security', emoji: '🛡️' },
  { label: 'Underground Drain', emoji: '🔧' },
  { label: 'Water Supply', emoji: '💧' },
  { label: 'Wide Roads', emoji: '🛣️' },
  { label: 'Park & Garden', emoji: '🌳' },
  { label: 'Vastu Layout', emoji: '🧭' },
  { label: 'CCTV', emoji: '📷' },
  { label: 'Gated Entry', emoji: '🚪' },
  { label: 'Power Backup', emoji: '⚡' },
  { label: 'Sewage System', emoji: '🏗️' },
];

const Checkbox = ({ label, checked, onChange, isDark = false }: { label: string; checked: boolean; onChange: (val: boolean) => void; isDark?: boolean }) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={() => onChange(!checked)} activeOpacity={0.7}>
    <View style={[styles.checkboxBox, { backgroundColor: isDark ? '#1F2937' : '#FFF', borderColor: isDark ? '#374151' : '#CBD5E1' }, checked && styles.checkboxBoxChecked]}>
      {checked && <Text style={styles.checkboxTick}>✓</Text>}
    </View>
    <Text style={[styles.checkboxLabel, { color: isDark ? '#F9FAFB' : '#475569' }]}>{label}</Text>
  </TouchableOpacity>
);

export default function AddPropertyScreen({ navigation, isDark = false }: { navigation: any; isDark?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);

  const [customDialog, setCustomDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    options?: { text: string; onPress: () => void; style?: 'cancel' | 'default' }[];
  }>({ visible: false, title: '', message: '' });

  const showDialog = (
    title: string,
    message: string,
    options?: { text: string; onPress: () => void; style?: 'cancel' | 'default' }[]
  ) => {
    setCustomDialog({ visible: true, title, message, options: options || [{ text: 'OK', onPress: () => {} }] });
  };

  // Core form
  const [form, setForm] = useState({
    title: '',
    price: '',
    priceLabel: '',
    location: '',
    locationHighlights: '',
    grounds: '',
    sqft: '',
    description: '',
    plotType: 'Residential',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
    status: 'For Sale',
    offerCode: '',
    offerValue: '',
    bankOffer: '',
    partnerOffer: '',
    specialNote: '',
    district: 'Tirunelveli',
    priceUnit: 'Cr',
    videoUrl: '',
    isReraVerified: false,
    isActiveAsset: true,
    isFeatured: false,
    isNegotiable: false,
  });

  // Media
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoLocalUri, setVideoLocalUri] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; uri: string; fileName: string }[]>([]);
  const [docLabel, setDocLabel] = useState('');

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<{ label: string; emoji: string }[]>(AVAILABLE_AMENITIES);
  const [customAmenitiesList, setCustomAmenitiesList] = useState<{ label: string; emoji: string }[]>([]);
  const [customEmoji, setCustomEmoji] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  // Nearby Infrastructure
  const [nearbyList, setNearbyList] = useState<{ icon: string; label: string; dist: string }[]>([]);
  const [nearbyIcon, setNearbyIcon] = useState('');
  const [nearbyLabel, setNearbyLabel] = useState('');
  const [nearbyDist, setNearbyDist] = useState('');

  const updateForm = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleAmenity = (amenity: { label: string; emoji: string }) => {
    const exists = selectedAmenities.find(a => a.label === amenity.label);
    if (exists) {
      setSelectedAmenities(prev => prev.filter(a => a.label !== amenity.label));
    } else {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  const addNearby = () => {
    if (!nearbyIcon.trim() || !nearbyLabel.trim() || !nearbyDist.trim()) {
      showDialog('Missing Info', 'Please enter icon, name, and distance for the nearby location.');
      return;
    }
    setNearbyList(prev => [...prev, { icon: nearbyIcon.trim(), label: nearbyLabel.trim(), dist: nearbyDist.trim() }]);
    setNearbyIcon('');
    setNearbyLabel('');
    setNearbyDist('');
  };

  const addCustomAmenity = () => {
    if (!customLabel.trim()) return;
    const item = { label: customLabel.trim(), emoji: customEmoji.trim() || '✅' };
    setCustomAmenitiesList(prev => [...prev, item]);
    setSelectedAmenities(prev => [...prev, item]);
    setCustomEmoji('');
    setCustomLabel('');
  };

  const normalizeUri = (uri: string): string => {
    if (uri.startsWith('ph://') || (!uri.startsWith('file://') && !uri.startsWith('http') && !uri.startsWith('content://'))) {
      return `file://${uri}`;
    }
    return uri;
  };

  const uploadImageUri = async (uri: string, index: number): Promise<string> => {
    const normalized = normalizeUri(uri);
    const ext = normalized.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `property_img_${Date.now()}_${index}.${ext}`;
    return api.uploadFile(normalized, fileName, `image/${ext === 'png' ? 'png' : 'jpeg'}`);
  };

  const handleSave = async () => {
    if (!form.title || !form.price || !form.location) {
      showDialog('Missing Info', 'Please fill in title, price, and location.');
      return;
    }

    const priceNum = parseFloat(form.price.replace(/[^0-9.]/g, ''));
    const finalPriceInRupees = form.priceUnit === 'Cr' ? priceNum * 10000000
      : form.priceUnit === 'L' ? priceNum * 100000
      : priceNum;

    setLoading(true);
    setUploadProgress('Uploading cover image...');

    try {
      // Upload cover image if it's a local file
      let coverUrl = '';
      if (form.image && !form.image.startsWith('http')) {
        coverUrl = await uploadImageUri(form.image, 0);
      } else {
        coverUrl = form.image || '';
      }

      // Upload gallery images
      const galleryUrls: string[] = [];
      for (let i = 0; i < galleryImages.length; i++) {
        const uri = galleryImages[i];
        setUploadProgress(`Uploading image ${i + 1}/${galleryImages.length}...`);
        if (!uri.startsWith('http')) {
          const url = await uploadImageUri(uri, i + 1);
          galleryUrls.push(url);
        } else {
          galleryUrls.push(uri);
        }
      }

      // Upload documents
      const documentUrls: { name: string; url: string }[] = [];
      for (let i = 0; i < uploadedDocs.length; i++) {
        const doc = uploadedDocs[i];
        setUploadProgress(`Uploading document ${i + 1}/${uploadedDocs.length}...`);
        if (!doc.uri.startsWith('http')) {
          const ext = doc.fileName.split('.').pop() || 'pdf';
          const url = await api.uploadFile(normalizeUri(doc.uri), doc.fileName, `application/${ext}`);
          documentUrls.push({ name: doc.name, url });
        } else {
          documentUrls.push({ name: doc.name, url: doc.uri });
        }
      }

      setUploadProgress('Saving property...');
      const allImages = [coverUrl, ...galleryUrls].filter(Boolean);
      const allAmenities = [
        ...selectedAmenities,
        ...customAmenitiesList.filter(c => !selectedAmenities.find(s => s.label === c.label)),
      ];

      const sqftNum = form.sqft ? parseInt(form.sqft.replace(/[^0-9]/g, ''), 10) : undefined;
      const groundNum = form.grounds ? parseFloat(form.grounds) : (sqftNum ? sqftNum / 2400 : undefined);

      await api.createProperty({
        title: form.title,
        description: form.description || form.locationHighlights,
        price: finalPriceInRupees,
        price_label: form.priceLabel || `₹${form.price} ${form.priceUnit}`,
        location: form.location,
        type: form.plotType,
        status: form.status || 'For Sale',
        images: allImages,
        district: form.district,
        sqft: sqftNum,
        ground: groundNum,
        plot_type: form.plotType,
        is_featured: form.isFeatured,
        is_rera_verified: form.isReraVerified,
        video_url: form.videoUrl || null,
        offer_code: form.offerCode || null,
        bank_offer: form.bankOffer || null,
        partner_offer: form.partnerOffer || null,
        amenities: allAmenities,
        nearby: nearbyList,
        documents: documentUrls,
      });

      setSuccessVisible(true);
    } catch (error: any) {
      showDialog('Save Error', `Could not save: ${error.message || error}`);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const handlePickImage = () => {
    showDialog('Select Cover Photo', 'Choose an option', [
      {
        text: '📷 Camera',
        onPress: async () => {
          const result = await launchCamera({ mediaType: 'photo', quality: 0.6, maxWidth: 1200, maxHeight: 1200 });
          if (result.assets?.[0]?.uri) setForm(prev => ({ ...prev, image: result.assets![0].uri! }));
        },
      },
      {
        text: '🖼️ Gallery',
        onPress: async () => {
          const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6, maxWidth: 1200, maxHeight: 1200 });
          if (result.assets?.[0]?.uri) setForm(prev => ({ ...prev, image: result.assets![0].uri! }));
        },
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handlePickGalleryImage = () => {
    showDialog('Add Gallery Photos', 'Choose an option', [
      {
        text: '📷 Camera',
        onPress: async () => {
          const result = await launchCamera({ mediaType: 'photo', quality: 0.6, maxWidth: 1200, maxHeight: 1200 });
          if (result.assets?.[0]?.uri) setGalleryImages(prev => [...prev, result.assets![0].uri!]);
        },
      },
      {
        text: '🖼️ Gallery (Multiple)',
        onPress: async () => {
          const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.6, maxWidth: 1200, maxHeight: 1200, selectionLimit: 0 });
          if (result.assets?.length) {
            const uris = result.assets.filter(a => a.uri).map(a => a.uri!);
            setGalleryImages(prev => [...prev, ...uris]);
          }
        },
      },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handlePickVideo = async () => {
    const result = await launchImageLibrary({ mediaType: 'video', videoQuality: 'medium' });
    if (result.assets?.[0]?.uri) {
      setVideoLocalUri(result.assets[0].uri);
      updateForm('videoUrl', '');
    }
  };

  const handlePickDocument = async () => {
    if (!docLabel.trim()) {
      showDialog('Missing Name', 'Enter a label for the document before selecting (e.g. DTCP Layout).');
      return;
    }
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images, DocumentPicker.types.docx],
        copyTo: 'cachesDirectory',
      });
      if (res?.[0]) {
        const fileUri = res[0].fileCopyUri || res[0].uri;
        setUploadedDocs(prev => [...prev, { name: docLabel.trim(), uri: fileUri, fileName: res[0].name || 'document.pdf' }]);
        setDocLabel('');
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) showDialog('Picker Error', 'Unable to pick document.');
    }
  };

  const theme = {
    background: isDark ? '#0B0F19' : '#F9F9F9',
    cardBg: isDark ? '#111827' : '#FFF',
    headerBg: isDark ? '#0B0F19' : '#FFF',
    text: isDark ? '#F9FAFB' : '#0F172A',
    subText: isDark ? '#9CA3AF' : '#64748B',
    border: isDark ? '#1F2937' : '#F1F5F9',
    headerBorder: isDark ? '#1F2937' : '#F1F5F9',
    inputBg: isDark ? '#1F2937' : '#F8FAFC',
    inputBorder: isDark ? '#374151' : '#E2E8F0',
    inputText: isDark ? '#FFF' : '#1E293B',
    tabBg: isDark ? '#1F2937' : '#F8FAFC',
    tabBorder: isDark ? '#374151' : '#E2E8F0',
    activeTabBg: isDark ? GOLD : '#0F172A',
    activeTabBorder: isDark ? GOLD : '#0F172A',
    uBoxBg: isDark ? '#1F2937' : '#F8FAFC',
    uBoxBorder: isDark ? '#374151' : '#E2E8F0',
    dividerColor: isDark ? '#1F2937' : '#E2E8F0',
    modalBg: isDark ? '#111827' : '#FFF',
    statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
    statusBarBg: isDark ? '#0B0F19' : '#FFF',
    amenityActiveBg: isDark ? '#3E3213' : '#FEF9EC',
    amenityInactiveBg: isDark ? '#1F2937' : '#F8FAFC',
    amenityInactiveBorder: isDark ? '#374151' : '#E2E8F0',
  };

  const chipTabStyle = (active: boolean) => [
    styles.chip,
    {
      backgroundColor: active ? theme.activeTabBg : theme.tabBg,
      borderColor: active ? theme.activeTabBorder : theme.tabBorder,
    },
  ];
  const chipTextStyle = (active: boolean) => [
    styles.chipText,
    { color: active ? '#FFF' : theme.subText },
  ];

  // ───────────────── STEP 1: Media & Details ─────────────────
  const renderStep1 = () => (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Asset — Step 1 of 2</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Cover Photo */}
          <Text style={styles.label}>PROPERTY COVER PHOTO</Text>
          <TouchableOpacity style={[styles.imageBox, { borderColor: theme.border }]} onPress={handlePickImage} activeOpacity={0.9}>
            <Image source={{ uri: form.image }} style={styles.img} />
            <View style={styles.imgOverlay}>
              <Text style={styles.imgLabel}>TAP TO PICK COVER PHOTO</Text>
            </View>
          </TouchableOpacity>

          {/* Gallery Photos */}
          <Text style={styles.label}>GALLERY PHOTOS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
            {galleryImages.map((uri, idx) => (
              <View key={idx} style={styles.galleryThumbWrapper}>
                <Image source={{ uri }} style={styles.galleryInputThumb} />
                <TouchableOpacity style={styles.galleryDeleteBtn} onPress={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}>
                  <Text style={styles.galleryDeleteTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.addGalleryCard, { borderColor: theme.border }]} onPress={handlePickGalleryImage}>
              <Text style={styles.addGalleryIcon}>+</Text>
              <Text style={styles.addGalleryTxt}>ADD PHOTO</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Walkthrough Video */}
          <Text style={styles.label}>WALKTHROUGH VIDEO</Text>
          {videoLocalUri ? (
            <View style={[styles.videoPickedCard, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
              <Text style={{ fontSize: 28 }}>🎬</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[{ fontSize: 13, fontWeight: '700', color: theme.text }]} numberOfLines={1}>
                  {videoLocalUri.split('/').pop()}
                </Text>
                <Text style={[{ fontSize: 11, color: theme.subText, marginTop: 2 }]}>Video selected — will upload on publish</Text>
              </View>
              <TouchableOpacity onPress={() => { setVideoLocalUri(null); updateForm('videoUrl', ''); }}>
                <Text style={{ fontSize: 18, color: '#EF4444' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addPointBtn, { height: 50, flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 15 }]}
              onPress={handlePickVideo}
            >
              <Text style={{ fontSize: 18, color: '#FFF' }}>🎬</Text>
              <Text style={styles.addPointBtnT}>PICK VIDEO FROM GALLERY</Text>
            </TouchableOpacity>
          )}

          {/* Legal Documents */}
          <Text style={styles.label}>LEGAL & PROJECT DOCUMENTS</Text>
          <View style={{ marginBottom: 8 }}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="Document Name (e.g. DTCP Layout, RERA License)"
              placeholderTextColor="#94A3B8"
              value={docLabel}
              onChangeText={setDocLabel}
            />
            <TouchableOpacity
              style={[styles.addPointBtn, { marginTop: 10, height: 45, flexDirection: 'row', gap: 6, justifyContent: 'center' }]}
              onPress={handlePickDocument}
            >
              <Text style={{ fontSize: 16, color: '#FFF' }}>📁</Text>
              <Text style={styles.addPointBtnT}>CHOOSE & ADD DOCUMENT</Text>
            </TouchableOpacity>
          </View>
          {uploadedDocs.map((doc, idx) => (
            <View key={idx} style={[styles.pointItemRow, { borderColor: theme.border, paddingVertical: 10, marginBottom: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Text style={{ fontSize: 18 }}>📄</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pointItemText, { color: theme.text }]} numberOfLines={1}>{doc.name}</Text>
                  <Text style={{ fontSize: 10, color: theme.subText }} numberOfLines={1}>{doc.fileName}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setUploadedDocs(prev => prev.filter((_, i) => i !== idx))}>
                <Text style={styles.pointItemDelete}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />

          {/* Property Details Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>

            <Text style={styles.label}>PROPERTY TITLE</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="e.g. Spic Garden Plot"
              placeholderTextColor="#94A3B8"
              value={form.title}
              onChangeText={t => updateForm('title', t)}
            />

            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top', backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="Detailed description of the asset..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={t => updateForm('description', t)}
            />

            <Text style={styles.label}>LOCATION / AREA NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="e.g. South Bypass, Thoothukudi"
              placeholderTextColor="#94A3B8"
              value={form.location}
              onChangeText={t => updateForm('location', t)}
            />

            <Text style={styles.label}>SELECT DISTRICT</Text>
            <TouchableOpacity
              onPress={() => setDistrictModalVisible(true)}
              style={[styles.districtDropdown, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
            >
              <Text style={[styles.districtDropdownText, { color: form.district ? theme.inputText : '#94A3B8' }]}>
                {form.district || 'Select District'}
              </Text>
              <Text style={styles.districtDropdownArrow}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.label}>STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {STATUS_OPTIONS.map(s => (
                <TouchableOpacity key={s} style={chipTabStyle(form.status === s)} onPress={() => updateForm('status', s)}>
                  <Text style={chipTextStyle(form.status === s)}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>PROPERTY TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {PLOT_TYPE_OPTIONS.map(t => (
                <TouchableOpacity key={t} style={chipTabStyle(form.plotType === t)} onPress={() => updateForm('plotType', t)}>
                  <Text style={chipTextStyle(form.plotType === t)}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.label}>PRICE</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                  placeholder="4.2"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={t => updateForm('price', t)}
                />
                {form.price ? <Text style={styles.previewPrice}>₹{form.price} {form.priceUnit}</Text> : null}
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>UNIT</Text>
                <View style={[styles.uBox, { backgroundColor: theme.uBoxBg, borderColor: theme.uBoxBorder }]}>
                  {['Cr', 'Lak'].map(u => (
                    <TouchableOpacity key={u} style={[styles.uBtn, form.priceUnit === u && styles.uActive]} onPress={() => updateForm('priceUnit', u)}>
                      <Text style={[styles.uT, form.priceUnit === u && styles.uActiveT]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>GROUNDS</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} placeholder="1.5" placeholderTextColor="#94A3B8" value={form.grounds} onChangeText={t => updateForm('grounds', t)} />
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>SQFT</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]} placeholder="2400" placeholderTextColor="#94A3B8" value={form.sqft} onChangeText={t => updateForm('sqft', t)} />
              </View>
            </View>

            <Text style={styles.label}>PUBLISH OPTIONS</Text>
            <Checkbox label="RERA Verified" checked={form.isReraVerified} onChange={val => updateForm('isReraVerified', val)} isDark={isDark} />
            <Checkbox label="Featured Property" checked={form.isFeatured} onChange={val => updateForm('isFeatured', val)} isDark={isDark} />

          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              if (!form.title || !form.price || !form.location) {
                Alert.alert('Missing Info', 'Please fill in title, price, and location.');
                return;
              }
              if (form.image.includes('unsplash')) {
                Alert.alert('Photo Missing', 'Please pick a cover photo first.');
                return;
              }
              setStep(2);
            }}
          >
            <Text style={styles.continueBtnT}>CONTINUE TO PRICING & PUBLISH →</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  // ───────────────── STEP 2: Pricing & Publish ─────────────────
  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Asset — Step 2 of 2</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Mini Preview Card */}
          <View style={[styles.previewCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Image source={{ uri: form.image }} style={styles.previewCardImg} />
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <Text style={[styles.previewCardTitle, { color: theme.text }]} numberOfLines={1}>{form.title || 'Untitled'}</Text>
              <Text style={[styles.previewCardSub, { color: theme.subText }]} numberOfLines={1}>{form.location}{form.location && form.district ? ' · ' : ''}{form.district}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>{form.status}</Text></View>
                <View style={[styles.previewBadge, { backgroundColor: '#E0F2FE' }]}><Text style={[styles.previewBadgeText, { color: '#0369A1' }]}>{form.plotType}</Text></View>
              </View>
              <Text style={[styles.previewCardPrice, { color: GOLD }]}>₹{form.price || '—'} {form.priceUnit}</Text>
            </View>
          </View>

          {/* Nearby Infrastructure */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 16 }]}>
            <Text style={styles.label}>NEARBY INFRASTRUCTURE</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Add schools, hospitals, stations, malls, etc.</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <TextInput
                style={[styles.input, { width: 56, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, textAlign: 'center', fontSize: 20, padding: 10 }]}
                placeholder="🏫"
                placeholderTextColor="#94A3B8"
                value={nearbyIcon}
                onChangeText={setNearbyIcon}
                maxLength={4}
              />
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                placeholder="Place name"
                placeholderTextColor="#94A3B8"
                value={nearbyLabel}
                onChangeText={setNearbyLabel}
              />
              <TextInput
                style={[styles.input, { width: 76, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                placeholder="1.2 km"
                placeholderTextColor="#94A3B8"
                value={nearbyDist}
                onChangeText={setNearbyDist}
              />
            </View>

            <TouchableOpacity style={[styles.addPointBtn, { height: 44, justifyContent: 'center', marginBottom: 12 }]} onPress={addNearby}>
              <Text style={styles.addPointBtnT}>+ ADD LOCATION</Text>
            </TouchableOpacity>

            {nearbyList.map((item, idx) => (
              <View key={idx} style={[styles.nearbyItem, { borderColor: theme.border }]}>
                <Text style={styles.nearbyItemIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nearbyItemLabel, { color: theme.text }]}>{item.label}</Text>
                  <Text style={[styles.nearbyItemDist, { color: theme.subText }]}>{item.dist}</Text>
                </View>
                <TouchableOpacity onPress={() => setNearbyList(prev => prev.filter((_, i) => i !== idx))}>
                  <Text style={styles.pointItemDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Pricing & Offers */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 16 }]}>
            <Text style={styles.label}>PRICING & OFFERS</Text>

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Display Price Label</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="e.g. Starting from ₹45 Lak"
              placeholderTextColor="#94A3B8"
              value={form.priceLabel}
              onChangeText={t => updateForm('priceLabel', t)}
            />

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Offer Code</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="FESTIVE50"
              placeholderTextColor="#94A3B8"
              value={form.offerCode}
              onChangeText={t => updateForm('offerCode', t)}
              autoCapitalize="characters"
            />

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Offer Value</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="₹50,000 Off"
              placeholderTextColor="#94A3B8"
              value={form.offerValue}
              onChangeText={t => updateForm('offerValue', t)}
            />

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Bank Loan Scheme</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: 'top', backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="e.g. SBI Home Loan at 8.4% p.a. up to 90% funding"
              placeholderTextColor="#94A3B8"
              multiline
              value={form.bankOffer}
              onChangeText={t => updateForm('bankOffer', t)}
            />

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Partner / Developer Offer</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: 'top', backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="e.g. Free registration for bookings before Dec 31"
              placeholderTextColor="#94A3B8"
              multiline
              value={form.partnerOffer}
              onChangeText={t => updateForm('partnerOffer', t)}
            />

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Special Note</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: 'top', backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="e.g. Limited plots available, book now!"
              placeholderTextColor="#94A3B8"
              multiline
              value={form.specialNote}
              onChangeText={t => updateForm('specialNote', t)}
            />
          </View>

          {/* Amenities & Features */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 16 }]}>
            <Text style={styles.label}>AMENITIES & FEATURES</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>Tap to toggle. All 12 selected by default.</Text>

            <View style={styles.amenitiesGrid}>
              {AVAILABLE_AMENITIES.map(amenity => {
                const active = !!selectedAmenities.find(a => a.label === amenity.label);
                return (
                  <TouchableOpacity
                    key={amenity.label}
                    style={[
                      styles.amenityChip,
                      {
                        backgroundColor: active ? theme.amenityActiveBg : theme.amenityInactiveBg,
                        borderColor: active ? GOLD : theme.amenityInactiveBorder,
                      },
                    ]}
                    onPress={() => toggleAmenity(amenity)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.amenityEmoji}>{amenity.emoji}</Text>
                    <Text style={[styles.amenityLabel, { color: active ? GOLD : theme.subText }]}>{amenity.label}</Text>
                    {active && <Text style={styles.amenityCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {customAmenitiesList.map((c, idx) => (
              <View key={idx} style={[styles.pointItemRow, { borderColor: theme.border }]}>
                <Text style={[styles.pointItemText, { color: theme.text }]}>{c.emoji} {c.label}</Text>
                <TouchableOpacity onPress={() => {
                  setCustomAmenitiesList(prev => prev.filter((_, i) => i !== idx));
                  setSelectedAmenities(prev => prev.filter(a => a.label !== c.label));
                }}>
                  <Text style={styles.pointItemDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.fieldLabel, { color: theme.subText, marginTop: 12 }]}>Add Custom Amenity</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { width: 60, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText, textAlign: 'center' }]}
                placeholder="🏊"
                placeholderTextColor="#94A3B8"
                value={customEmoji}
                onChangeText={setCustomEmoji}
                maxLength={4}
              />
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
                placeholder="e.g. Swimming Pool"
                placeholderTextColor="#94A3B8"
                value={customLabel}
                onChangeText={setCustomLabel}
              />
              <TouchableOpacity style={styles.addPointBtn} onPress={addCustomAmenity}>
                <Text style={styles.addPointBtnT}>ADD</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Highlights */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 16 }]}>
            <Text style={styles.label}>LOCATION HIGHLIGHTS</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top', backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }]}
              placeholder="e.g. 5 mins to Railway Station, Near Apollo Hospital..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={form.locationHighlights}
              onChangeText={t => updateForm('locationHighlights', t)}
            />
          </View>

          {/* Publish Settings */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 16 }]}>
            <Text style={styles.label}>PUBLISH SETTINGS</Text>
            <Checkbox label="Active Asset (visible in app)" checked={form.isActiveAsset} onChange={val => updateForm('isActiveAsset', val)} isDark={isDark} />
            <Checkbox label="Negotiable Price" checked={form.isNegotiable} onChange={val => updateForm('isNegotiable', val)} isDark={isDark} />
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <TouchableOpacity
              style={[styles.saveBtn, { flex: 1, backgroundColor: isDark ? '#1F2937' : '#E2E8F0', borderWidth: 1, borderColor: isDark ? '#374151' : '#CBD5E1' }]}
              onPress={() => setStep(1)}
            >
              <Text style={[styles.saveBtnT, { color: theme.text }]}>← BACK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { flex: 2, backgroundColor: isDark ? GOLD : '#0F172A' }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={[styles.saveBtnT, { color: '#FFF' }]}>{uploadProgress || 'PUBLISHING...'}</Text>
                </View>
              ) : (
                <Text style={[styles.saveBtnT, { color: '#FFF' }]}>PUBLISH PROPERTY</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

      {step === 1 ? renderStep1() : renderStep2()}

      {/* District Picker Modal */}
      <Modal visible={districtModalVisible} transparent animationType="slide">
        <View style={styles.mOverlay}>
          <View style={[styles.mCard, { backgroundColor: theme.modalBg, paddingHorizontal: 0, paddingTop: 0, maxHeight: '75%', width: '90%' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.inputBorder }}>
              <Text style={[styles.mTitle, { color: theme.text, marginBottom: 0, fontSize: 16 }]}>Select District</Text>
              <TouchableOpacity onPress={() => setDistrictModalVisible(false)}>
                <Text style={{ fontSize: 20, color: '#94A3B8' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 12, paddingTop: 8 }}>
              {DISTRICTS.map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => { updateForm('district', d); setDistrictModalVisible(false); }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    marginBottom: 4,
                    backgroundColor: form.district === d ? 'rgba(201,168,76,0.15)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: form.district === d ? GOLD : theme.text }}>
                    {d}
                  </Text>
                  {form.district === d && <Text style={{ color: GOLD, fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successVisible} transparent>
        <View style={styles.mOverlay}>
          <View style={[styles.mCard, { backgroundColor: theme.modalBg }]}>
            <Text style={styles.mIcon}>✅</Text>
            <Text style={[styles.mTitle, { color: theme.text }]}>Asset Published</Text>
            <Text style={[styles.mMsg, { color: theme.subText }]}>Property is now live in the registry.</Text>
            <TouchableOpacity style={styles.mBtn} onPress={() => { setSuccessVisible(false); navigation.goBack(); }}>
              <Text style={styles.mBtnT}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Dialog */}
      <Modal visible={customDialog.visible} transparent animationType="fade">
        <View style={styles.mOverlay}>
          <View style={[styles.mCard, { backgroundColor: theme.modalBg, width: '85%' }]}>
            <Text style={[styles.mTitle, { color: theme.text, fontSize: 18, marginBottom: 8 }]}>{customDialog.title}</Text>
            {customDialog.message ? (
              <Text style={[styles.mMsg, { color: theme.subText, marginBottom: 20, textAlign: 'center' }]}>{customDialog.message}</Text>
            ) : null}
            <View style={{ width: '100%', gap: 10 }}>
              {customDialog.options?.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dialogBtn,
                    opt.style === 'cancel'
                      ? { backgroundColor: isDark ? '#1F2937' : '#F1F5F9', borderWidth: 1, borderColor: theme.border }
                      : { backgroundColor: GOLD },
                  ]}
                  onPress={() => {
                    setCustomDialog(prev => ({ ...prev, visible: false }));
                    // Delay so the modal fully dismisses before launching a native picker (iOS requirement)
                    setTimeout(() => opt.onPress(), Platform.OS === 'ios' ? 350 : 0);
                  }}
                >
                  <Text style={[styles.dialogBtnT, opt.style === 'cancel' ? { color: theme.subText } : { color: '#FFF' }]}>
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtnText: { color: GOLD, fontSize: 24, fontWeight: '900' },
  headerTitle: { color: '#0F172A', fontSize: 16, fontWeight: '900', marginLeft: 20 },
  scroll: { padding: 20 },

  imageBox: { width: '100%', height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1 },
  img: { width: '100%', height: '100%' },
  imgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 12, alignItems: 'center' },
  imgLabel: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  galleryThumbWrapper: { position: 'relative', marginRight: 12, width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  galleryInputThumb: { width: 80, height: 80 },
  galleryDeleteBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.9)', justifyContent: 'center', alignItems: 'center' },
  galleryDeleteTxt: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  addGalleryCard: { width: 80, height: 80, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', marginRight: 12 },
  videoPickedCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 15 },
  addGalleryIcon: { fontSize: 20, color: GOLD, fontWeight: 'bold' },
  addGalleryTxt: { fontSize: 8, color: '#94A3B8', fontWeight: '800', marginTop: 4 },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },

  label: { color: GOLD, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8, marginTop: 15 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 12 },
  sectionSubtitle: { fontSize: 11, fontWeight: '600', marginBottom: 12 },

  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 15, color: '#1E293B', fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 4 },
  districtDropdown: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  districtDropdownText: { fontSize: 14, fontWeight: '700' },
  districtDropdownArrow: { fontSize: 18, color: '#94A3B8' },

  row: { flexDirection: 'row' },

  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginRight: 10, borderWidth: 1 },
  chipText: { fontSize: 10, fontWeight: '900' },

  uBox: { flexDirection: 'row', borderRadius: 15, padding: 4, height: 50, borderWidth: 1 },
  uBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  uActive: { backgroundColor: GOLD },
  uT: { fontSize: 10, fontWeight: '900', color: '#64748B' },
  uActiveT: { color: '#FFF' },

  previewPrice: { color: GOLD, fontSize: 10, fontWeight: '900', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 10 },
  checkboxBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  checkboxBoxChecked: { borderColor: GOLD, backgroundColor: GOLD },
  checkboxTick: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  checkboxLabel: { fontSize: 13, fontWeight: '700', color: '#475569' },

  continueBtn: { backgroundColor: GOLD, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 30, shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
  continueBtnT: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  saveBtn: { height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveBtnT: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

  addPointBtn: { backgroundColor: GOLD, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  addPointBtnT: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  pointItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1 },
  pointItemText: { fontSize: 13, fontWeight: '600', flex: 1 },
  pointItemDelete: { fontSize: 13, color: '#EF4444', fontWeight: 'bold', paddingHorizontal: 5 },

  previewCard: { flexDirection: 'row', borderRadius: 16, padding: 12, borderWidth: 1, alignItems: 'center' },
  previewCardImg: { width: 80, height: 80, borderRadius: 12 },
  previewCardTitle: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  previewCardSub: { fontSize: 11, fontWeight: '600' },
  previewBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  previewBadgeText: { fontSize: 9, fontWeight: '900', color: '#B45309' },
  previewCardPrice: { fontSize: 15, fontWeight: '900', marginTop: 6 },

  nearbyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  nearbyItemIcon: { fontSize: 22, marginRight: 10 },
  nearbyItemLabel: { fontSize: 13, fontWeight: '700' },
  nearbyItemDist: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  amenityEmoji: { fontSize: 16 },
  amenityLabel: { fontSize: 11, fontWeight: '700' },
  amenityCheck: { fontSize: 11, color: GOLD, fontWeight: '900', marginLeft: 2 },

  mOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', padding: 30 },
  mCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 35, alignItems: 'center' },
  mIcon: { fontSize: 50, marginBottom: 15 },
  mTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  mMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 20 },
  mBtn: { backgroundColor: GOLD, width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mBtnT: { color: '#FFF', fontWeight: '900' },
  dialogBtn: { width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dialogBtnT: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
