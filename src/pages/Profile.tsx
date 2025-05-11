import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  
  const { 
    register: registerProfile, 
    handleSubmit: handleSubmitProfile, 
    formState: { errors: profileErrors } 
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    }
  });
  
  const { 
    register: registerPassword, 
    handleSubmit: handleSubmitPassword, 
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors } 
  } = useForm<PasswordFormData>();
  
  const newPassword = watchPassword('newPassword');

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setSubmittingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);
      
      await axios.put('http://localhost:5000/api/users/profile', data);
      
      setProfileSuccess('Profil bilgileriniz başarıyla güncellendi!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setProfileError(err.response?.data?.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setSubmittingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      
      await axios.put('http://localhost:5000/api/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      setPasswordSuccess('Şifreniz başarıyla güncellendi!');
      resetPassword();
    } catch (err: any) {
      console.error('Error updating password:', err);
      setPasswordError(err.response?.data?.message || 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil ve Ayarlar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-800">Profil Bilgileri</h2>
              <p className="text-gray-600">Kişisel bilgilerinizi güncelleyin</p>
            </div>
          </div>
          
          {profileError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {profileError}
            </div>
          )}
          
          {profileSuccess && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
              {profileSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-gray-700 font-medium mb-2">
                  Ad
                </label>
                <input
                  id="firstName"
                  type="text"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    profileErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...registerProfile('firstName', { 
                    required: 'Ad gereklidir',
                    minLength: {
                      value: 2,
                      message: 'Ad en az 2 karakter olmalıdır'
                    }
                  })}
                />
                {profileErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-gray-700 font-medium mb-2">
                  Soyad
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    profileErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...registerProfile('lastName', { 
                    required: 'Soyad gereklidir',
                    minLength: {
                      value: 2,
                      message: 'Soyad en az 2 karakter olmalıdır'
                    }
                  })}
                />
                {profileErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  profileErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                {...registerProfile('email', { 
                  required: 'E-posta adresi gereklidir',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Geçerli bir e-posta adresi giriniz'
                  }
                })}
              />
              {profileErrors.email && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              disabled={submittingProfile}
            >
              {submittingProfile ? 'Güncelleniyor...' : 'Profili Güncelle'}
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-800">Şifre Değiştir</h2>
              <p className="text-gray-600">Hesap güvenliğiniz için şifrenizi güncelleyin</p>
            </div>
          </div>
          
          {passwordError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
              {passwordSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-2">
                Mevcut Şifre
              </label>
              <input
                id="currentPassword"
                type="password"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                {...registerPassword('currentPassword', { 
                  required: 'Mevcut şifre gereklidir'
                })}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
                Yeni Şifre
              </label>
              <input
                id="newPassword"
                type="password"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                {...registerPassword('newPassword', { 
                  required: 'Yeni şifre gereklidir',
                  minLength: {
                    value: 6,
                    message: 'Şifre en az 6 karakter olmalıdır'
                  }
                })}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Yeni Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                {...registerPassword('confirmPassword', { 
                  required: 'Şifre tekrarı gereklidir',
                  validate: value => value === newPassword || 'Şifreler eşleşmiyor'
                })}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              disabled={submittingPassword}
            >
              {submittingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;