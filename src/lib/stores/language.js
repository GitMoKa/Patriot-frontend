import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Translation dictionaries
const translations = {
	en: {
		// Navigation
		home: 'Home',
		profile: 'Profile',
		orders: 'My Orders',
		password: 'Password',
		login: 'Login',
		logout: 'Logout',
		signup: 'Sign Up',
		
		// Common
		loading: 'Loading...',
		save: 'Save',
		cancel: 'Cancel',
		delete: 'Delete',
		edit: 'Edit',
		create: 'Create',
		update: 'Update',
		search: 'Search',
		filter: 'Filter',
		all: 'All',
		name: 'Name',
		email: 'Email',
		password: 'Password',
		confirmPassword: 'Confirm Password',
		phone: 'Phone',
		address: 'Address',
		
		// Home page
		welcomeToPatriot: 'Welcome to Patriot Glass Factory',
		aboutUs: 'About Us',
		ourProducts: 'Our Products',
		createOrder: 'Create Order',
		viewProduct: 'View Product',
		orderNow: 'Order Now',
		allCategories: 'All Categories',
		
		// Product details
		productDetails: 'Product Details',
		description: 'Description',
		width: 'Width',
		height: 'Height',
		type: 'Type',
		category: 'Category',
		
		// Orders
		myOrders: 'My Orders',
		orderNumber: 'Order Number',
		status: 'Status',
		totalAmount: 'Total Amount',
		createdAt: 'Created At',
		orderDetails: 'Order Details',
		addItem: 'Add Item',
		orderItems: 'Order Items',
		
		// Order creation
		createNewOrder: 'Create New Order',
		addOrderItem: 'Add Order Item',
		chooseItemType: 'Do you want to choose an item type?',
		chooseExistingProduct: 'Do you want to choose an existing product?',
		materials: 'Materials',
		wantPaint: 'Do you want paint on the glass?',
		wantDrilled: 'Do you want the glass drilled?',
		
		// Auth
		forgotPassword: 'Forgot Password?',
		dontHaveAccount: "Don't have an account? Sign up",
		alreadyHaveAccount: 'Already have an account? Login',
		resetPassword: 'Reset Password',
		
		// Profile
		profileInformation: 'Profile Information',
		editProfile: 'Edit Profile',
		changePassword: 'Change Password',
		currentPassword: 'Current Password',
		newPassword: 'New Password',
		
		// Messages
		loginSuccess: 'Login successful',
		logoutSuccess: 'Logout successful',
		orderCreated: 'Order created successfully',
		profileUpdated: 'Profile updated successfully',
		passwordUpdated: 'Password updated successfully',
		
		// Errors
		loginFailed: 'Login failed',
		invalidCredentials: 'Invalid email or password',
		passwordMismatch: 'Passwords do not match',
		requiredField: 'This field is required',
		invalidEmail: 'Please enter a valid email address',
		
		// Status
		pending: 'Pending',
		completed: 'Completed',
		shipped: 'Shipped',
		cancelled: 'Cancelled'
	},
	ar: {
		// Navigation
		home: 'الرئيسية',
		profile: 'الملف الشخصي',
		orders: 'طلباتي',
		password: 'كلمة المرور',
		login: 'تسجيل الدخول',
		logout: 'تسجيل الخروج',
		signup: 'إنشاء حساب',
		
		// Common
		loading: 'جاري التحميل...',
		save: 'حفظ',
		cancel: 'إلغاء',
		delete: 'حذف',
		edit: 'تعديل',
		create: 'إنشاء',
		update: 'تحديث',
		search: 'بحث',
		filter: 'تصفية',
		all: 'الكل',
		name: 'الاسم',
		email: 'البريد الإلكتروني',
		password: 'كلمة المرور',
		confirmPassword: 'تأكيد كلمة المرور',
		phone: 'الهاتف',
		address: 'العنوان',
		
		// Home page
		welcomeToPatriot: 'مرحباً بكم في مصنع باتريوت للزجاج',
		aboutUs: 'من نحن',
		ourProducts: 'منتجاتنا',
		createOrder: 'إنشاء طلب',
		viewProduct: 'عرض المنتج',
		orderNow: 'اطلب الآن',
		allCategories: 'جميع الفئات',
		
		// Product details
		productDetails: 'تفاصيل المنتج',
		description: 'الوصف',
		width: 'العرض',
		height: 'الارتفاع',
		type: 'النوع',
		category: 'الفئة',
		
		// Orders
		myOrders: 'طلباتي',
		orderNumber: 'رقم الطلب',
		status: 'الحالة',
		totalAmount: 'المبلغ الإجمالي',
		createdAt: 'تاريخ الإنشاء',
		orderDetails: 'تفاصيل الطلب',
		addItem: 'إضافة عنصر',
		orderItems: 'عناصر الطلب',
		
		// Order creation
		createNewOrder: 'إنشاء طلب جديد',
		addOrderItem: 'إضافة عنصر للطلب',
		chooseItemType: 'هل تريد اختيار نوع العنصر؟',
		chooseExistingProduct: 'هل تريد اختيار منتج موجود؟',
		materials: 'المواد',
		wantPaint: 'هل تريد طلاء على الزجاج؟',
		wantDrilled: 'هل تريد ثقب الزجاج؟',
		
		// Auth
		forgotPassword: 'نسيت كلمة المرور؟',
		dontHaveAccount: 'ليس لديك حساب؟ إنشاء حساب',
		alreadyHaveAccount: 'لديك حساب بالفعل؟ تسجيل الدخول',
		resetPassword: 'إعادة تعيين كلمة المرور',
		
		// Profile
		profileInformation: 'معلومات الملف الشخصي',
		editProfile: 'تعديل الملف الشخصي',
		changePassword: 'تغيير كلمة المرور',
		currentPassword: 'كلمة المرور الحالية',
		newPassword: 'كلمة المرور الجديدة',
		
		// Messages
		loginSuccess: 'تم تسجيل الدخول بنجاح',
		logoutSuccess: 'تم تسجيل الخروج بنجاح',
		orderCreated: 'تم إنشاء الطلب بنجاح',
		profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
		passwordUpdated: 'تم تحديث كلمة المرور بنجاح',
		
		// Errors
		loginFailed: 'فشل تسجيل الدخول',
		invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
		passwordMismatch: 'كلمات المرور غير متطابقة',
		requiredField: 'هذا الحقل مطلوب',
		invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
		
		// Status
		pending: 'قيد الانتظار',
		completed: 'مكتمل',
		shipped: 'تم الشحن',
		cancelled: 'ملغي'
	}
};

// Create language store
function createLanguageStore() {
	// Get initial language from localStorage or default to English
	const getInitialLanguage = () => {
		if (browser) {
			const stored = localStorage.getItem('language');
			if (stored && translations[stored]) return stored;
			
			// Check browser language
			const browserLang = navigator.language.split('-')[0];
			if (translations[browserLang]) return browserLang;
		}
		return 'en';
	};

	const { subscribe, set, update } = writable(getInitialLanguage());

	return {
		subscribe,
		
		// Set language
		setLanguage: (lang) => {
			if (translations[lang]) {
				set(lang);
				if (browser) {
					localStorage.setItem('language', lang);
					document.documentElement.setAttribute('lang', lang);
					document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
				}
			}
		},

		// Get translation
		t: (key, currentLang = 'en') => {
			return translations[currentLang]?.[key] || translations.en[key] || key;
		},

		// Initialize language
		init: () => {
			if (browser) {
				const lang = getInitialLanguage();
				document.documentElement.setAttribute('lang', lang);
				document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
				set(lang);
			}
		}
	};
}

export const languageStore = createLanguageStore();

// Helper function to get translation
export function t(key) {
	let currentLang = 'en';
	languageStore.subscribe(lang => currentLang = lang)();
	return translations[currentLang]?.[key] || translations.en[key] || key;
}

