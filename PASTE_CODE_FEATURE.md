# Функциональность вставки кода подтверждения

## Описание
Теперь при вставке кода подтверждения из буфера обмена (Ctrl+V) код автоматически распределяется по всем полям ввода.

## Как это работает

### 1. Вставка из буфера обмена
- Пользователь копирует код подтверждения (например, "123456")
- Вставляет его в любое поле ввода (Ctrl+V)
- Код автоматически распределяется по всем 6 полям

### 2. Обработка длинного ввода
- Если пользователь вводит более одного символа в поле
- Код автоматически распределяется по полям
- Берутся только первые 6 символов

### 3. Очистка данных
- При вставке удаляются все нецифровые символы
- Оставляются только цифры
- Максимум 6 символов

## Изменения в коде

### EmailVerification.jsx

#### 1. Обновлена функция `handleCodeChange`
```javascript
const handleCodeChange = (index, value) => {
  const newCode = [...code];
  
  // Если вставлен длинный код (например, из буфера обмена)
  if (value.length > 1) {
    // Берем только первые 6 символов
    const codeToInsert = value.slice(0, 6);
    
    // Распределяем код по полям
    for (let i = 0; i < 6; i++) {
      newCode[i] = codeToInsert[i] || '';
    }
    
    setCode(newCode);
    
    // Фокусируемся на последнем заполненном поле или первом пустом
    const lastFilledIndex = Math.min(codeToInsert.length - 1, 5);
    const nextInput = document.querySelector(`input[data-index="${lastFilledIndex}"]`);
    if (nextInput) nextInput.focus();
    return;
  }
  
  // Обычный ввод одного символа
  newCode[index] = value;
  setCode(newCode);

  // Автоматический переход к следующему полю
  if (value && index < 5) {
    const nextInput = document.querySelector(`input[data-index="${index + 1}"]`);
    if (nextInput) nextInput.focus();
  }
};
```

#### 2. Добавлена функция `handlePaste`
```javascript
const handlePaste = (e) => {
  e.preventDefault();
  const pastedData = e.clipboardData.getData('text');
  
  // Убираем все нецифровые символы
  const cleanCode = pastedData.replace(/\D/g, '').slice(0, 6);
  
  if (cleanCode.length > 0) {
    const newCode = [...code];
    
    // Распределяем код по полям
    for (let i = 0; i < 6; i++) {
      newCode[i] = cleanCode[i] || '';
    }
    
    setCode(newCode);
    
    // Фокусируемся на последнем заполненном поле или первом пустом
    const lastFilledIndex = Math.min(cleanCode.length - 1, 5);
    const nextInput = document.querySelector(`input[data-index="${lastFilledIndex}"]`);
    if (nextInput) nextInput.focus();
  }
};
```

#### 3. Добавлен обработчик `onPaste` к полям ввода
```javascript
<input
  key={index}
  type="text"
  data-index={index}
  value={digit}
  onChange={(e) => handleCodeChange(index, e.target.value)}
  onKeyDown={(e) => handleKeyDown(index, e)}
  onPaste={handlePaste}  // ← Новый обработчик
  className="code-input"
  maxLength={1}
  autoFocus={index === 0}
/>
```

## Тестирование

### Сценарий 1: Вставка кода из буфера обмена
1. Скопируйте код подтверждения "123456"
2. Вставьте его в любое поле ввода (Ctrl+V)
3. Код должен распределиться по всем полям: [1][2][3][4][5][6]

### Сценарий 2: Вставка кода с лишними символами
1. Скопируйте "123-456" или "123 456"
2. Вставьте в поле ввода
3. Должно получиться: [1][2][3][4][5][6] (лишние символы удалены)

### Сценарий 3: Вставка короткого кода
1. Скопируйте "123"
2. Вставьте в поле ввода
3. Должно получиться: [1][2][3][ ][ ][ ] (остальные поля пустые)

### Сценарий 4: Вставка длинного кода
1. Скопируйте "123456789"
2. Вставьте в поле ввода
3. Должно получиться: [1][2][3][4][5][6] (только первые 6 символов)

## Преимущества
- Удобство для пользователей - можно быстро вставить код из email
- Автоматическая очистка от лишних символов
- Сохранение существующей функциональности посимвольного ввода
- Автоматический переход фокуса на нужное поле
