export const cities = [
  'المكلا',
  'سيئون',
  'الشحر',
  'تريم',
  'القطن',
  'رخية',
  'الديس الشرقية',
  'الديس الغربية',
  'بروم',
  'غيل بن يمين',
  'عمد',
  'حورة',
];

export const socialStatuses = [
  { value: 'single', label: 'أعزب' },
  { value: 'married', label: 'متزوج' },
  { value: 'divorced', label: 'مطلق' },
  { value: 'widowed', label: 'أرمل' },
];

export const getSocialStatuses = (gender) => gender === 'female'
  ? [
      { value: 'single', label: 'عزباء' },
      { value: 'married', label: 'متزوجة' },
      { value: 'divorced', label: 'مطلقة' },
      { value: 'widowed', label: 'أرملة' },
    ]
  : socialStatuses;

export const getMaritalPreferences = (gender) => gender === 'female'
  ? [
      { value: 'single', label: 'عزباء' },
      { value: 'divorced', label: 'مطلقة' },
      { value: 'widowed', label: 'أرملة' },
      { value: 'any', label: 'لا يهم' },
    ]
  : [
      { value: 'single', label: 'أعزب' },
      { value: 'divorced', label: 'مطلق' },
      { value: 'widowed', label: 'أرمل' },
      { value: 'any', label: 'لا يهم' },
    ];

export const educationLevels = [
  { value: 'primary', label: 'ابتدائي' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'secondary', label: 'ثانوي' },
  { value: 'diploma', label: 'دبلوم' },
  { value: 'bachelor', label: 'بكالوريوس' },
  { value: 'master', label: 'ماجستير' },
  { value: 'phd', label: 'دكتوراه' },
];

export const occupations = [
  'طالب/طالبة',
  'موظف حكومي',
  'موظف قطاع خاص',
  'مهندس',
  'طبيب/طبيبة',
  'معلم/معلمة',
  'تاجر/تاجرة',
  'صاحب عمل',
  'عامل',
  'ربة منزل',
  'غير موظف حالياً',
  'أخرى',
];

export const skinColors = [
  { value: 'very_fair', label: 'أبيض جداً' },
  { value: 'fair', label: 'أبيض' },
  { value: 'medium', label: 'حنطي' },
  { value: 'olive', label: 'زيتوني' },
  { value: 'brown', label: 'أسمر' },
  { value: 'dark', label: 'داكن جداً' },
];

export const origins = [
  { value: 'tribal', label: 'قبلي' },
  { value: 'urban', label: 'حضري' },
  { value: 'rural', label: 'ريفي' },
];

export const religiousLevels = [
  { value: 'very_practicing', label: 'ملتزم جداً' },
  { value: 'practicing', label: 'ملتزم' },
  { value: 'moderate', label: 'متوسط' },
  { value: 'less_practicing', label: 'أقل التزاماً' },
];

export const maritalPreferences = [
  { value: 'single', label: 'أعزب/عزباء' },
  { value: 'divorced', label: 'مطلق/مطلقة' },
  { value: 'widowed', label: 'أرمل/أرملة' },
  { value: 'any', label: 'لا يهم' },
];

export const sampleProfiles = [
  {
    id: 'p1',
    userId: 'u1',
    gender: 'male',
    name: 'أحمد سالم باحميد',
    age: 29,
    city: 'المكلا',
    socialStatus: 'single',
    education: 'bachelor',
    occupation: 'مهندس',
    height: 175,
    skinColor: 'medium',
    origin: 'urban',
    religiousLevel: 'practicing',
    aboutMe: 'شاب ملتزم، أبحث عن زوجة صالحة تساعدني على الدنيا والدين.',
    partnerSpecs: {
      minAge: 22,
      maxAge: 28,
      cities: ['المكلا', 'سيئون'],
      socialStatus: 'single',
      education: 'any',
      occupation: 'any',
      religiousLevel: 'practicing',
    },
    isApproved: true,
    isVisible: true,
    photo: null,
    createdAt: '2025-01-10',
  },
  {
    id: 'p2',
    userId: 'u2',
    gender: 'female',
    name: 'فاطمة سعيد',
    age: 24,
    city: 'سيئون',
    socialStatus: 'single',
    education: 'bachelor',
    occupation: 'معلمة',
    height: 160,
    skinColor: 'fair',
    origin: 'tribal',
    religiousLevel: 'very_practicing',
    aboutMe: 'أبحث عن زوج صالح يخاف الله ويتقي الله فيني.',
    partnerSpecs: {
      minAge: 26,
      maxAge: 32,
      cities: ['المكلا', 'سيئون', 'الشحر'],
      socialStatus: 'single',
      education: 'bachelor',
      occupation: 'any',
      religiousLevel: 'practicing',
    },
    isApproved: true,
    isVisible: true,
    photo: null,
    createdAt: '2025-01-12',
  },
  {
    id: 'p3',
    userId: 'u3',
    gender: 'male',
    name: 'محمد عبدالله',
    age: 34,
    city: 'الشحر',
    socialStatus: 'divorced',
    education: 'master',
    occupation: 'طبيب',
    height: 180,
    skinColor: 'brown',
    origin: 'urban',
    religiousLevel: 'practicing',
    aboutMe: 'طبيب أبحث عن زوجة متعلمة تقدر مسؤوليات البيت.',
    partnerSpecs: {
      minAge: 25,
      maxAge: 33,
      cities: ['المكلا', 'الشحر'],
      socialStatus: 'any',
      education: 'bachelor',
      occupation: 'any',
      religiousLevel: 'practicing',
    },
    isApproved: true,
    isVisible: true,
    photo: null,
    createdAt: '2025-01-15',
  },
  {
    id: 'p4',
    userId: 'u4',
    gender: 'female',
    name: 'خديجة علي',
    age: 27,
    city: 'المكلا',
    socialStatus: 'widowed',
    education: 'diploma',
    occupation: 'ربة منزل',
    height: 165,
    skinColor: 'olive',
    origin: 'rural',
    religiousLevel: 'practicing',
    aboutMe: 'أم لطفل واحد، أبحث عن رجل طيب يتحمل المسؤولية.',
    partnerSpecs: {
      minAge: 30,
      maxAge: 40,
      cities: ['المكلا'],
      socialStatus: 'any',
      education: 'any',
      occupation: 'any',
      religiousLevel: 'practicing',
    },
    isApproved: true,
    isVisible: true,
    photo: null,
    createdAt: '2025-01-18',
  },
];

export const sampleMessages = [
  {
    id: 'm1',
    senderId: 'u1',
    receiverId: 'u2',
    senderName: 'أحمد سالم باحميد',
    receiverName: 'فاطمة سعيد',
    content: 'السلام عليكم ورحمة الله، أنا مهتم بملفكم الشخصي وأود التعرف أكثر بالحلال.',
    status: 'approved',
    createdAt: '2025-01-20T10:30:00',
    approvedAt: '2025-01-20T11:00:00',
  },
  {
    id: 'm2',
    senderId: 'u3',
    receiverId: 'u4',
    senderName: 'محمد عبدالله',
    receiverName: 'خديجة علي',
    content: 'وعليكم السلام، هل يمكنني معرفة المزيد عن شخصيتك وطموحاتك؟',
    status: 'pending',
    createdAt: '2025-01-21T14:20:00',
    approvedAt: null,
  },
];

export const sampleUsers = [
  {
    id: 'u1',
    email: 'ahmed@example.com',
    role: 'user',
    gender: 'male',
    isActive: true,
    createdAt: '2025-01-10',
  },
  {
    id: 'u2',
    email: 'fatima@example.com',
    role: 'user',
    gender: 'female',
    isActive: true,
    createdAt: '2025-01-12',
  },
  {
    id: 'u3',
    email: 'mohammed@example.com',
    role: 'user',
    gender: 'male',
    isActive: true,
    createdAt: '2025-01-15',
  },
  {
    id: 'u4',
    email: 'khadija@example.com',
    role: 'user',
    gender: 'female',
    isActive: true,
    createdAt: '2025-01-18',
  },
];

export const getLabel = (list, value) =>
  list.find((item) => item.value === value)?.label || value;

export const getEducationLabel = (value) => getLabel(educationLevels, value);
export const getSocialLabel = (value, gender = 'male') => getLabel(getSocialStatuses(gender), value);
export const getSkinLabel = (value) => getLabel(skinColors, value);
export const getOriginLabel = (value) => getLabel(origins, value);
export const getReligiousLabel = (value) => getLabel(religiousLevels, value);