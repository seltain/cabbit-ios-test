# Сборка Cabbit iOS Test с Windows

## Что уже сделано и что ещё нужно проверить

Подготовлен самостоятельный Expo/React Native-проект и workflow `.github/workflows/build-ios-unsigned.yml`. Проверены TypeScript, версии зависимостей, production-экспорт iOS JavaScript/Hermes, introspection iOS-конфигурации и логика проверки структуры IPA. Локальные JS-проверки выполнены с Node.js 24.17.0; runner использует закреплённую Node.js 22.14.0.

**Настоящего IPA в этом комплекте пока нет:** macOS/Xcode-сборка не запускалась, установка и запуск на iPhone не проверены. Вы выбрали подготовку локальных файлов без публикации в GitHub. Для следующего этапа нужно создать новый репозиторий и вручную запустить workflow ниже.

## Почему этот подход возможен

Expo генерирует обычный нативный iOS-проект через Prebuild. Xcode на macOS компилирует его для `iphoneos` в конфигурации `Release` с отключённой подписью. Полученный `.app` содержит нативный arm64-код и встроенный JavaScript/Hermes bundle. Скрипт помещает его в `Payload/CabbitTest.app` и создаёт ZIP с расширением `.ipa`. Затем Sideloadly на Windows получает provisioning profile и подписывает приложение вашим бесплатным Apple ID.

Это технически реализуемое разделение компиляции и подписи. Успех именно этого проекта нужно подтвердить первым запуском workflow и тестом на физическом устройстве. Структурная проверка IPA сама по себе не доказывает успешную установку или запуск.

Локальная Xcode-сборка на Windows недоступна. Стандартная EAS-сборка с подписью для физического iPhone обычно предполагает Apple Developer Program; здесь EAS не используется. Симуляторный `.app`, Expo Go и веб-приложение не являются результатом этой сборки.

## Инструменты и фиксация версий

| Часть | Выбор |
| --- | --- |
| ОС runner | GitHub `macos-15` |
| Xcode | `16.4`, путь `/Applications/Xcode_16.4.app` |
| Node.js | `22.14.0` |
| Ruby / Bundler | `3.3.7` / `2.6.9` |
| CocoaPods | `1.16.2` в `Gemfile` |
| Expo / React Native | `54.0.37` / `0.81.5` |
| iPhone | iOS `15.1+`, arm64 |
| Bundle ID | `com.cabbit.iostest` |

SDK 54 выбран как фиксированная совместимая база для маленького теста. Его официальный шаблон включён в закреплённый npm-пакет Expo; минимальная iOS в шаблоне — 15.1. Современная стабильная iOS удовлетворяет этому минимуму; совместимость с конкретным устройством и Sideloadly проверяется установкой. Версию iOS можно посмотреть: **Настройки → Основные → Об этом устройстве**.

`package-lock.json` фиксирует дерево npm-зависимостей; workflow использует `npm ci`. Native-папка `ios/` генерируется на macOS и не хранится в Git. iOS-настройки задаёт `app.json`: iPhone, портретная ориентация, светлая тема, Hermes, отдельный Bundle ID, версия 1.0.0 и build 1. Подпись, development team и сертификаты не заданы.

`Gemfile.lock` и `ios/Podfile.lock` появятся на runner и попадут в артефакт. До первой macOS-сборки их нет: транзитивные Ruby/Pods-зависимости ещё не зафиксированы. GitHub также обновляет базовый runner; это воспроизводимый процесс, а не обещание побитово одинакового IPA. После успешного первого запуска можно сохранить `Gemfile.lock` в репозитории и Podfile.lock для дальнейшей фиксации native-зависимостей.

## 1. Новый GitHub-репозиторий

Создайте на GitHub пустой репозиторий `cabbit-ios-test` без автоматически добавленных README/.gitignore. Выберите видимость сами. Для публичных репозиториев стандартные GitHub-hosted runners бесплатны; приватные используют квоту вашего плана, а macOS учитывается с повышенным коэффициентом. Проверьте условия Actions в вашем аккаунте перед запуском. Платный Apple Developer Account для этого workflow не нужен.

В папке проекта уже инициализирован отдельный Git-репозиторий с веткой `main`. Если вы распаковали ZIP проекта, выполните `git init -b main`. Затем откройте PowerShell **в папке `cabbit-ios-test`**:

```powershell
git status
git add .
git commit -m "Create Cabbit iOS Test"
git remote add origin https://github.com/YOUR_LOGIN/cabbit-ios-test.git
git push -u origin main
```

Замените `YOUR_LOGIN` своим GitHub-логином. Если Git просит имя/email, задайте свои значения через `git config user.name` и `git config user.email` в этом отдельном репозитории. При push войдите в GitHub через Git Credential Manager. Перед push убедитесь, что `git status` относится к тестовой папке, а remote — к новому репозиторию.

`.gitignore` исключает `node_modules`, `ios`, сборки и IPA. `.gitattributes` сохраняет LF для bash-скриптов даже после работы на Windows. Не загружайте Apple ID, пароли или сертификаты в GitHub: workflow не нуждается ни в одном из них.

## 2. Запуск Actions

1. Откройте новый репозиторий → **Actions**; при необходимости включите Actions.
2. Выберите **Build unsigned iPhone IPA**.
3. Нажмите **Run workflow**, выберите `main`, подтвердите запуск.
4. Дождитесь завершения job `build`. Workflow запускается только вручную.

Workflow устанавливает пакеты, проверяет TypeScript/версии и валидатор, делает `expo prebuild --platform ios --no-install`, затем `bundle exec pod install`. После этого выполняется:

```bash
xcodebuild \
  -workspace ios/CabbitTest.xcworkspace \
  -scheme CabbitTest \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath <fresh-build-directory> \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=NO \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' DEVELOPMENT_TEAM='' build
```

Это объяснение команды; workflow сам подставляет свежий каталог. Для повторного запуска на macOS: `npm ci --include=dev`, `bundle install`, `npm run prebuild:ios`, `bundle exec pod install --project-directory=ios`, `npm run build:ios:unsigned`. На Windows последняя команда не собирает IPA.

`Release` включает в `.app` файл `main.jsbundle`; приложение не требует Metro после установки. Скрипт удаляет подписи предсобранных библиотек в копии для упаковки. `xcodebuild -exportArchive` не используется, поскольку он возвращает процесс к требованию подписи/provisioning.

## 3. Скачать и проверить результат

На странице успешного запуска внизу найдите **Artifacts → CabbitTest-unsigned-iphone-N**. Скачайте ZIP и **распакуйте** его. Внутри должен быть настоящий `CabbitTest-unsigned.ipa`, файл SHA-256, `ipa-validation.json`, информация об инструментах и lock-файлы.

В Sideloadly передавайте именно `.ipa` после распаковки, а не внешний ZIP GitHub. Структура IPA:

```text
Payload/
  CabbitTest.app/
    CabbitTest          # нативный исполняемый файл arm64 / iPhoneOS
    Info.plist
    main.jsbundle      # встроенный JS/Hermes
    Frameworks/        # если присутствуют динамические библиотеки
    ...
```

Перед публикацией артефакта `verify-ipa.py` проверяет iPhoneOS в plist, arm64 и платформу iOS в Mach-O (включая библиотеки), отсутствие шифрования/подписи и наличие непустого bundle. **arm64 симулятора тоже отклоняется** по `LC_BUILD_VERSION`, а не только по архитектуре. Скрипт использует только стандартную библиотеку Python.

Опциональная повторная проверка на Windows с Python 3.11+:

```powershell
python scripts/verify-ipa.py C:\path\CabbitTest-unsigned.ipa --require-unsigned
Get-FileHash C:\path\CabbitTest-unsigned.ipa -Algorithm SHA256
```

Сравните SHA-256 с файлом из артефакта. Далее откройте [INSTALL_IPHONE.md](INSTALL_IPHONE.md).

## Если сборка не прошла

- Откройте первый упавший шаг и скачайте `CabbitTest-build-logs-N`. До стадии Xcode полноценного `xcodebuild.log` может не быть; причина будет в логе шага Actions.
- Нет Xcode 16.4: проверьте актуальный список ПО `macos-15`. При удалении этой версии надо выбрать доступную совместимую версию и повторить проверку; не переключайте SDK на `iphonesimulator`.
- Ошибка npm: убедитесь, что загружен `package-lock.json`. После намеренного изменения зависимостей обновите его через `npm install` и закоммитьте.
- Ошибка Pods/загрузки бинарных зависимостей: изучите лог `Install iOS pods`; при сетевом сбое повторите запуск. Не добавляйте сертификаты как «исправление».
- Ошибка code signing: проверьте, что запускается этот workflow и `CODE_SIGNING_ALLOWED=NO` передаётся Xcode.
- Не найден `main.jsbundle`: проверьте `Release` и bundling phase в логе. Такой артефакт специально не публикуется.
- IPA прошёл проверки, но падает на iPhone: сначала исключите истёкшую подпись, доверие и Developer Mode; затем сохраните crash-log через **Настройки → Конфиденциальность и безопасность → Аналитика и улучшения → Данные аналитики**. Успешная сборка не заменяет тест запуска.

## Источники

Проверено 12 октября 2026 года:

- [Expo: Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/) — генерация native-проектов.
- [Expo: SDK 54](https://docs.expo.dev/versions/v54.0.0/) — версии React Native, минимум iOS/Xcode.
- [Expo: build infrastructure](https://docs.expo.dev/build-reference/infrastructure/) — совместимость SDK 54 и Xcode 16.4.
- [Expo: development builds](https://docs.expo.dev/develop/development-builds/introduction/) — сборка своими native-инструментами без платного аккаунта.
- [GitHub: macos-15 runner](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md) — доступность Xcode.
- [GitHub: ручной запуск](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow), [артефакты](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts), [оплата Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- [Sideloadly](https://sideloadly.io/) и [FAQ](https://sideloadly.io/faq.html) — установка и повторная подпись бесплатным Apple ID.
