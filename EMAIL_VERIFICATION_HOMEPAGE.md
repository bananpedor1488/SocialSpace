# Автоматическая проверка верификации email на домашней странице

## Описание
Добавлена автоматическая проверка статуса верификации email при загрузке домашней страницы. Если пользователь зарегистрирован, но его email не подтвержден, он автоматически перенаправляется на страницу верификации.

## Как это работает

### 1. **Проверка при загрузке**
- При загрузке домашней страницы система проверяет статус верификации email
- Проверка происходит как из localStorage, так и с сервера
- Если `emailVerified: false`, пользователь перенаправляется на верификацию

### 2. **Логика проверки**
```javascript
// Проверка из localStorage
if (!parsedUser.emailVerified) {
  setVerificationData({
    userId: parsedUser._id,
    email: parsedUser.email,
    isFromLogin: false
  });
  setShowEmailVerification(true);
  return;
}

// Проверка с сервера
if (!userData.emailVerified) {
  setVerificationData({
    userId: userData._id,
    email: userData.email,
    isFromLogin: false
  });
  setShowEmailVerification(true);
  return;
}
```

### 3. **Состояния компонента**
- `showEmailVerification` - показывает/скрывает компонент верификации
- `verificationData` - данные для верификации (userId, email, isFromLogin)
- `handleVerificationSuccess` - обработчик успешной верификации
- `handleVerificationBack` - обработчик возврата (выход из аккаунта)

## Технические изменения

### HomePage.jsx
1. **Импорт компонента**:
   ```javascript
   import EmailVerification from '../components/EmailVerification';
   ```

2. **Новые состояния**:
   ```javascript
   const [showEmailVerification, setShowEmailVerification] = useState(false);
   const [verificationData, setVerificationData] = useState(null);
   ```

3. **Функции обработки**:
   ```javascript
   const handleVerificationSuccess = (verifiedUser) => {
     setUser(verifiedUser);
     setShowEmailVerification(false);
     setVerificationData(null);
     localStorage.setItem('user', JSON.stringify(verifiedUser));
   };

   const handleVerificationBack = () => {
     setShowEmailVerification(false);
     setVerificationData(null);
     clearTokens();
     navigate('/');
   };
   ```

4. **Проверка в useEffect**:
   - Проверка из localStorage при инициализации
   - Проверка с сервера при загрузке данных пользователя

5. **Рендеринг компонента**:
   ```javascript
   {showEmailVerification && verificationData && (
     <EmailVerification
       userId={verificationData.userId}
       email={verificationData.email}
       onVerificationSuccess={handleVerificationSuccess}
       onBack={handleVerificationBack}
       isFromLogin={verificationData.isFromLogin}
     />
   )}
   ```

## Пользовательский опыт

### Сценарий 1: Неверифицированный пользователь
1. Пользователь входит в аккаунт
2. Перенаправляется на домашнюю страницу
3. Система автоматически проверяет верификацию email
4. Если email не верифицирован, показывается компонент верификации
5. Пользователь может:
   - Подтвердить email и продолжить использование
   - Вернуться к входу (выйти из аккаунта)

### Сценарий 2: Верифицированный пользователь
1. Пользователь входит в аккаунт
2. Перенаправляется на домашнюю страницу
3. Система проверяет верификацию email
4. Если email верифицирован, пользователь получает доступ к функционалу

## Безопасность

### Защита от обхода
- Проверка происходит как на клиенте, так и на сервере
- Даже если пользователь изменит данные в localStorage, серверная проверка предотвратит обход
- При попытке доступа к защищенным функциям без верификации, пользователь будет перенаправлен

### Очистка данных
- При возврате из верификации (отмена) происходит полный выход из аккаунта
- Все токены и данные пользователя очищаются
- Пользователь перенаправляется на страницу входа

## Тестирование

### Тестовые сценарии
1. **Регистрация без верификации**:
   - Зарегистрировать нового пользователя
   - Попытаться войти в аккаунт
   - Проверить перенаправление на верификацию

2. **Верифицированный пользователь**:
   - Войти с верифицированным email
   - Проверить доступ к домашней странице

3. **Отмена верификации**:
   - Нажать "Назад" в компоненте верификации
   - Проверить выход из аккаунта

4. **Успешная верификация**:
   - Подтвердить email
   - Проверить доступ к функционалу

### API тестирование
```bash
# Проверка статуса пользователя
GET /api/me

# Ожидаемый ответ для неверифицированного пользователя
{
  "user": {
    "_id": "userId",
    "email": "user@example.com",
    "emailVerified": false,
    // ... другие поля
  }
}
```

## Будущие улучшения

1. **Уведомления** - показывать уведомления о необходимости верификации
2. **Автоматическая отправка кода** - отправлять код верификации при первом входе
3. **Напоминания** - периодически напоминать о необходимости верификации
4. **Ограничения функционала** - ограничить доступ к определенным функциям без верификации
