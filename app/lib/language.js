'use client'
import { createContext, useContext, useState } from 'react'

export const translations = {
  en: {
    appName: 'QuickSewa',
    tagline: 'See it. Snap it. Fix it.',
    taglineSub: 'Report civic issues in Hyderabad instantly. One photo. Zero forms. Direct to GHMC.',
    reportBtn: '📸 Report an Issue',
    mapBtn: '🗺️ View Live Map',
    dashboardBtn: 'Officer Dashboard →',
    footer: 'Serving Hyderabad · Built for GHMC',
    issuesReported: 'Issues Reported',
    resolvedWeek: 'Resolved This Week',
    wardsCovered: 'Wards Covered',
    unableToLoad: 'Unable to load stats',

    reportTitle: 'Report an Issue',
    tapPhoto: 'Tap to take a photo',
    orGallery: 'or choose from gallery',
    changePhoto: 'Change photo',
    issueType: 'Issue type',
    descriptionLabel: 'Description',
    descriptionOptional: '(optional)',
    descriptionPlaceholder: 'Any additional details...',
    titleLabel: 'Grievance Title',
    titlePlaceholder: 'Give it a title (optional)',
    submitBtn: 'Submit Complaint →',
    submitting: 'Submitting...',
    locationLoading: 'Getting your location...',
    locationFound: 'Location captured',
    locationFallback: 'Using approximate location',
    useMyLocation: 'Use My Location',
    useMyLocationSub: 'Auto-detected via GPS',
    pickOnMap: 'Pick on Map',
    pickOnMapSub: 'Tap anywhere on Hyderabad map',
    tapMapPin: '👆 Tap the map to drop a pin',
    selectedLocation: 'Selected',
    aiScanning: 'QuickSewa AI is analysing your photo...',
    aiComplete: 'AI Analysis Complete ✨',
    aiDetected: 'AI detected',
    aiConfident: 'confident',
    detectedIssue: 'Detected Issue',
    confidenceLabel: 'Detection Confidence',
    lowConfidence: '⚠️ Low confidence detection — please verify the issue type',
    aiEditDetails: 'Edit Details',
    aiConfirmSubmit: 'Confirm & Submit',
    aiUnavailable: '⚠️ AI analysis unavailable — please fill in details manually',
    aiUrgent: '🚨 Urgent — This issue poses immediate risk to citizens',
    aiEstimate: 'Estimated repair',
    aiDepartment: 'Responsible dept',
    alsoDetected: 'Also detected',

    successTitle: 'Complaint Filed!',
    successId: 'Your complaint ID',
    successMsg: 'Your complaint has been sent to the GHMC ward officer. You will receive an update within 72 hours. If unresolved, it will auto-escalate to the supervisor.',
    viewMap: 'View on Live Map',
    backHome: 'Back to Home',
    viewReport: 'View Complaint Report',

    mapTitle: 'QuickSewa · Live Map',
    issues: 'issues',
    filterAll: 'All',
    open: 'Open',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    hoursRemaining: 'h remaining',
    hoursOverdue: 'h OVERDUE',
    escalated: 'Escalated',
    sameIssue: 'Same issue',
    justNow: 'Just now',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',

    officerLogin: 'Officer Login',
    officerDashboard: 'GHMC Ward Officer Dashboard',
    enterPassword: 'Enter password',
    loginBtn: 'Login →',
    demoPassword: 'Demo password: officer123',
    dashboardTitle: 'QuickSewa · Officer Dashboard',
    dashboardSub: 'GHMC Hyderabad · Sorted by upvotes',
    refresh: '↻ Refresh',
    total: 'Total',
    markInProgress: 'Mark In Progress',
    markResolved: '✓ Mark Resolved',
    issueResolved: '✅ Issue resolved',
    loading: 'Loading...',
    noComplaints: 'No complaints found.',

    categories: {
      Pothole: 'Pothole',
      Garbage: 'Garbage',
      Streetlight: 'Streetlight',
      Waterlogging: 'Waterlogging',
      Encroachment: 'Encroachment',
      Other: 'Other'
    }
  },

  te: {
    appName: 'క్విక్సేవ',
    tagline: 'చూడు. తీయి. పరిష్కరించు.',
    taglineSub: 'హైదరాబాద్లో పౌర సమస్యలను వెంటనే నివేదించండి. ఒక ఫోటో. జీరో ఫారాలు. నేరుగా GHMC కి.',
    reportBtn: '📸 సమస్యను నివేదించు',
    mapBtn: '🗺️ లైవ్ మ్యాప్ చూడు',
    dashboardBtn: 'అధికారి డాష్బోర్డ్ →',
    footer: 'హైదరాబాద్ సేవలో · GHMC కోసం నిర్మించబడింది',
    issuesReported: 'నివేదించిన సమస్యలు',
    resolvedWeek: 'ఈ వారం పరిష్కరించబడింది',
    wardsCovered: 'వార్డులు కవర్ చేయబడ్డాయి',
    unableToLoad: 'సమాచారాన్ని లోడ్ చేయలేకపోయాము',

    reportTitle: 'సమస్యను నివేదించు',
    tapPhoto: 'ఫోటో తీయడానికి నొక్కండి',
    orGallery: 'లేదా గ్యాలరీ నుండి ఎంచుకోండి',
    changePhoto: 'ఫోటో మార్చు',
    issueType: 'సమస్య రకం',
    descriptionLabel: 'వివరణ',
    descriptionOptional: '(ఐచ్ఛికం)',
    descriptionPlaceholder: 'అదనపు వివరాలు...',
    titleLabel: 'ఫిర్యాదు శీర్షిక',
    titlePlaceholder: 'శీర్షిక ఇవ్వండి (ఐచ్ఛికం)',
    submitBtn: 'ఫిర్యాదు సమర్పించు →',
    submitting: 'సమర్పిస్తున్నారు...',
    locationLoading: 'మీ స్థానాన్ని పొందుతున్నారు...',
    locationFound: 'స్థానం గుర్తించబడింది',
    locationFallback: 'అంచనా స్థానాన్ని ఉపయోగిస్తున్నారు',
    useMyLocation: 'నా స్థానం వాడు',
    useMyLocationSub: 'GPS ద్వారా స్వయంచాలకంగా',
    pickOnMap: 'మ్యాప్లో ఎంచుకో',
    pickOnMapSub: 'హైదరాబాద్ మ్యాప్పై ఎక్కడైనా నొక్కండి',
    tapMapPin: '👆 పిన్ వేయడానికి మ్యాప్ నొక్కండి',
    selectedLocation: 'ఎంచుకున్న స్థానం',
    aiScanning: 'క్విక్సేవ AI మీ ఫోటోను విశ్లేషిస్తోంది...',
    aiComplete: 'AI విశ్లేషణ పూర్తయింది ✨',
    aiDetected: 'AI గుర్తించింది',
    aiConfident: 'నిర్ధారణ',
    detectedIssue: 'గుర్తించబడిన సమస్య',
    confidenceLabel: 'విశ్వసనీయత స్థాయి',
    lowConfidence: '⚠️ తక్కువ విశ్వసనీయత గుర్తింపు — దయచేసి సమస్య రకాన్ని నిర్ధారించండి',
    aiEditDetails: 'వివరాలు మార్చు',
    aiConfirmSubmit: 'నిర్ధారించి సమర్పించు',
    aiUnavailable: '⚠️ AI విశ్లేషణ అందుబాటులో లేదు — దయచేసి వివరాలు మాన్యువల్గా నమోదు చేయండి',
    aiUrgent: '🚨 అత్యవసరం — ఈ సమస్య పౌరులకు తక్షణ ప్రమాదం కలిగిస్తుంది',
    aiEstimate: 'అంచనా మరమ్మత్తు ఖర్చు',
    aiDepartment: 'బాధ్యత గల విభాగం',
    alsoDetected: 'కూడా గుర్తించబడింది',

    successTitle: 'ఫిర్యాదు నమోదైంది!',
    successId: 'మీ ఫిర్యాదు ID',
    successMsg: 'మీ ఫిర్యాదు GHMC వార్డు అధికారికి పంపబడింది. 72 గంటల్లో అప్డేట్ అందుతుంది. పరిష్కరించకపోతే పర్యవేక్షకుడికి స్వయంచాలకంగా పంపబడుతుంది.',
    viewMap: 'లైవ్ మ్యాప్లో చూడు',
    backHome: 'హోమ్కి తిరిగి వెళ్ళు',
    viewReport: 'ఫిర్యాదు రిపోర్ట్ చూడు',

    mapTitle: 'క్విక్సేవ · లైవ్ మ్యాప్',
    issues: 'సమస్యలు',
    filterAll: 'అన్నీ',
    open: 'తెరిచి ఉంది',
    inProgress: 'పురోగతిలో ఉంది',
    resolved: 'పరిష్కరించబడింది',
    hoursRemaining: 'గంటలు మిగిలాయి',
    hoursOverdue: 'గంటలు ఆలస్యం',
    escalated: 'పెంచబడింది',
    sameIssue: 'అదే సమస్య',
    justNow: 'ఇప్పుడే',
    hoursAgo: 'గం. క్రితం',
    daysAgo: 'రో. క్రితం',

    officerLogin: 'అధికారి లాగిన్',
    officerDashboard: 'GHMC వార్డు అధికారి డాష్బోర్డ్',
    enterPassword: 'పాస్వర్డ్ నమోదు చేయండి',
    loginBtn: 'లాగిన్ →',
    demoPassword: 'డెమో పాస్వర్డ్: officer123',
    dashboardTitle: 'క్విక్సేవ · అధికారి డాష్బోర్డ్',
    dashboardSub: 'GHMC హైదరాబాద్ · అప్వోట్ల వారీగా క్రమబద్ధీకరించబడింది',
    refresh: '↻ రిఫ్రెష్',
    total: 'మొత్తం',
    markInProgress: 'పురోగతిలో ఉందని గుర్తించు',
    markResolved: '✓ పరిష్కరించబడిందని గుర్తించు',
    issueResolved: '✅ సమస్య పరిష్కరించబడింది',
    loading: 'లోడవుతోంది...',
    noComplaints: 'ఫిర్యాదులు కనుగొనబడలేదు.',

    categories: {
      Pothole: 'గుంత',
      Garbage: 'చెత్త',
      Streetlight: 'వీధి దీపం',
      Waterlogging: 'నీరు నిల్వ',
      Encroachment: 'అతిక్రమణ',
      Other: 'ఇతర'
    }
  }
}

export const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: translations.en
})

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
