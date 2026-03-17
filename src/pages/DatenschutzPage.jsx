import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { BRAND } from '../constants/brand';
import { useTranslation } from '../contexts/LanguageContext';

export default function DatenschutzPage() {
  const navigate = useNavigate();
  const t = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          ← {t('back')}
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-6 sm:p-8 md:p-10" dir="ltr">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t('datenschutz')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
            Wir freuen uns über Ihren Besuch auf unserer Website Deutsch-Tests.com. Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie darüber, welche personenbezogenen Daten wir verarbeiten, zu welchen Zwecken dies geschieht und welche Rechte Ihnen zustehen.
          </p>

          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              1. Verantwortlicher
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            </p>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium mb-1">Essam Hammam</p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
              E-Mail: <a href="mailto:deutschvorbereitungstests@gmail.com" className="underline hover:opacity-80" style={{ color: BRAND.red }}>deutschvorbereitungstests@gmail.com</a>
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              2. Allgemeine Hinweise zur Datenverarbeitung
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Wir verarbeiten personenbezogene Daten ausschließlich im Rahmen der geltenden datenschutzrechtlichen Vorschriften.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Die Verarbeitung personenbezogener Daten erfolgt insbesondere zu folgenden Zwecken:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>zur Bereitstellung der Website und ihrer Funktionen</li>
              <li>zur Registrierung und Verwaltung von Benutzerkonten</li>
              <li>zur Bereitstellung kostenloser und kostenpflichtiger Lernangebote</li>
              <li>zur Bearbeitung von Anfragen</li>
              <li>zur Abwicklung von Zahlungen</li>
              <li>zum Versand von Newslettern, soweit Sie eingewilligt haben</li>
              <li>zur Gewährleistung der Sicherheit und Stabilität der Website</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Soweit wir für Verarbeitungsvorgänge Ihre Einwilligung einholen, erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO. Soweit die Verarbeitung zur Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist, erfolgt sie auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO. Soweit wir einer rechtlichen Verpflichtung unterliegen, erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Soweit die Verarbeitung zur Wahrung unserer berechtigten Interessen erforderlich ist, erfolgt sie auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              3. Aufruf der Website und Server-Logfiles
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Beim Besuch unserer Website werden durch den Hosting-Anbieter bzw. den Server automatisch Informationen erfasst und in sogenannten Server-Logfiles gespeichert. Dies betrifft insbesondere:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>IP-Adresse</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>aufgerufene Seite oder Datei</li>
              <li>Browsertyp und Browserversion</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer-URL</li>
              <li>Hostname des zugreifenden Rechners</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Diese Daten werden verarbeitet, um die Website technisch bereitzustellen, die Sicherheit und Stabilität zu gewährleisten und Missbrauch zu erkennen. Eine Zusammenführung dieser Daten mit anderen Datenquellen erfolgt nicht, sofern hierfür keine rechtliche Grundlage besteht.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren, stabilen und funktionsfähigen Bereitstellung unseres Online-Angebots.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              4. Registrierung und Benutzerkonto
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Für die Nutzung bestimmter Inhalte und Funktionen kann die Erstellung eines Benutzerkontos erforderlich sein. Dabei verarbeiten wir die von Ihnen im Registrierungsprozess eingegebenen Daten, insbesondere:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>E-Mail-Adresse</li>
              <li>Passwort</li>
              <li>gegebenenfalls weitere freiwillige Angaben</li>
              <li>Informationen zu Ihrem Nutzerkonto</li>
              <li>gegebenenfalls Lernfortschritte, Testergebnisse oder gebuchte Leistungen, soweit diese Funktionen auf der Plattform angeboten werden</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Verarbeitung erfolgt zur Einrichtung und Verwaltung des Benutzerkontos sowie zur Bereitstellung der von Ihnen genutzten Funktionen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die Verarbeitung für die Durchführung des Nutzungsverhältnisses erforderlich ist. Soweit einzelne Angaben freiwillig erfolgen, kann die Verarbeitung zusätzlich auf Art. 6 Abs. 1 lit. a DSGVO beruhen.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              5. Kostenpflichtige Inhalte und Zahlungen
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Soweit auf unserer Website kostenpflichtige Inhalte, Abonnements oder zeitlich begrenzte Zugänge angeboten werden, verarbeiten wir die zur Vertragsabwicklung erforderlichen Daten. Dazu gehören insbesondere:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>Bestandsdaten</li>
              <li>Kontaktdaten</li>
              <li>Buchungsdaten</li>
              <li>Zahlungsstatus</li>
              <li>Transaktionsdaten</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Zahlungsabwicklung erfolgt über den jeweils im Bestellprozess angebotenen Zahlungsdienstleister. Dabei werden die für die Zahlungsabwicklung erforderlichen Daten an den jeweiligen Zahlungsdienstleister übermittelt. Die eigentliche Verarbeitung sensibler Zahlungsdaten erfolgt in der Regel direkt durch den jeweiligen Zahlungsdienstleister.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Durchführung des Vertrags sowie gegebenenfalls auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO, soweit gesetzliche Aufbewahrungs- oder Nachweispflichten bestehen.
            </p>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-3 italic">
              Wichtig: Wenn konkrete Anbieter wie Stripe, PayPal, Klarna oder andere genutzt werden, sollten diese in der endgültigen Fassung zusätzlich namentlich genannt werden.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              6. Kontaktaufnahme
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wenn Sie uns per E-Mail oder auf anderem Weg kontaktieren, verarbeiten wir die von Ihnen übermittelten Daten zur Bearbeitung Ihrer Anfrage. Dazu gehören insbesondere Ihr Name, Ihre E-Mail-Adresse und der Inhalt Ihrer Nachricht.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit einem Vertrag oder einer vorvertraglichen Maßnahme zusammenhängt, oder auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO aufgrund unseres berechtigten Interesses an der Bearbeitung von Anfragen.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              7. Newsletter
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wenn Sie sich für unseren Newsletter anmelden, verarbeiten wir Ihre E-Mail-Adresse sowie gegebenenfalls weitere freiwillig angegebene Daten, um Ihnen Informationen über neue Inhalte, Übungen, Funktionen, Angebote oder sonstige Neuigkeiten zuzusenden.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Verarbeitung erfolgt ausschließlich auf Grundlage Ihrer Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Sie können den Newsletter jederzeit über den Abmeldelink in der jeweiligen E-Mail oder durch eine Nachricht an uns abbestellen.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              8. Cookies, Local Storage und Einwilligungsmanagement
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Unsere Website kann Cookies oder ähnliche Technologien verwenden. Dabei kann es sich um technisch notwendige Technologien handeln, die für den Betrieb der Website und einzelner Funktionen erforderlich sind. Darüber hinaus können – soweit eingesetzt – auch optionale Technologien verwendet werden, etwa zur Reichweitenmessung, Analyse oder zur Einbindung externer Inhalte.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Soweit eine Speicherung von Informationen auf Ihrem Endgerät oder ein Zugriff auf Informationen auf Ihrem Endgerät nicht technisch zwingend erforderlich ist, erfolgt dies nur mit Ihrer Einwilligung. Rechtsgrundlage ist dann Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG. Technisch notwendige Cookies oder vergleichbare Technologien können auf Grundlage von § 25 Abs. 2 TDDDG sowie Art. 6 Abs. 1 lit. f DSGVO eingesetzt werden.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Sofern ein Cookie-Banner oder Consent-Tool eingesetzt wird, dient dieses dazu, Ihre Einwilligungen zu verwalten und zu dokumentieren.
            </p>
            <p className="text-base text-slate-500 dark:text-slate-400 italic">
              Hinweis: Falls Google Analytics, Meta Pixel, YouTube-Einbettungen, Google Fonts, reCAPTCHA oder andere Dritttools eingesetzt werden, sollten diese in der Datenschutzerklärung zusätzlich einzeln aufgeführt werden.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              9. Empfänger von Daten und Auftragsverarbeiter
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Wir übermitteln personenbezogene Daten nur dann an Dritte, wenn dies rechtlich zulässig ist. Eine Übermittlung kann insbesondere erfolgen an:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>Hosting-Dienstleister</li>
              <li>technische Dienstleister</li>
              <li>Zahlungsdienstleister</li>
              <li>E-Mail- oder Newsletter-Dienstleister</li>
              <li>sonstige Auftragsverarbeiter, die in unserem Auftrag tätig werden</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Soweit Dienstleister in unserem Auftrag personenbezogene Daten verarbeiten, erfolgt dies auf Grundlage eines Vertrags über Auftragsverarbeitung, soweit gesetzlich erforderlich.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              10. Speicherdauer
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Daten aus Benutzerkonten speichern wir grundsätzlich für die Dauer des Bestehens des Kontos sowie darüber hinaus nur, soweit gesetzliche Pflichten oder berechtigte Interessen dies erfordern. Daten im Zusammenhang mit Verträgen und Zahlungen speichern wir im Rahmen der geltenden handels- und steuerrechtlichen Aufbewahrungspflichten. Daten aus Kontaktanfragen löschen wir, sobald die Bearbeitung abgeschlossen ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              11. Ihre Rechte
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Sie haben nach der DSGVO insbesondere folgende Rechte:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>Recht auf Auskunft</li>
              <li>Recht auf Berichtigung</li>
              <li>Recht auf Löschung</li>
              <li>Recht auf Einschränkung der Verarbeitung</li>
              <li>Recht auf Datenübertragbarkeit</li>
              <li>Recht auf Widerspruch gegen die Verarbeitung</li>
              <li>Recht auf Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen Datenschutzrecht verstößt, haben Sie außerdem das Recht, Beschwerde bei einer Aufsichtsbehörde einzulegen. Diese Rechte ergeben sich insbesondere aus den Art. 13 ff., 15 ff. und 77 DSGVO.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              12. Beschwerderecht bei der zuständigen Aufsichtsbehörde
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Eine Beschwerde können Sie unter anderem bei der für uns zuständigen Aufsichtsbehörde einlegen, die Sie unter folgenden Kontaktdaten erreichen:
            </p>
            <div className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 font-medium">
              <p>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</p>
              <p>Promenade 18</p>
              <p>91522 Ansbach</p>
              <p className="mt-2">Tel.: +49 981 1800930</p>
              <p>Fax: +49 981 180093800</p>
              <p>E-Mail: <a href="mailto:poststelle@lda.bayern.de" className="underline hover:opacity-80" style={{ color: BRAND.red }}>poststelle@lda.bayern.de</a></p>
            </div>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              13. Externe Links
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Unsere Website kann Links zu externen Websites Dritter enthalten. Für die Inhalte und Datenschutzpraktiken dieser externen Websites sind ausschließlich deren jeweilige Betreiber verantwortlich.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              14. Änderung dieser Datenschutzerklärung
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn dies aufgrund rechtlicher, technischer oder organisatorischer Änderungen erforderlich wird. Es gilt jeweils die auf unserer Website veröffentlichte aktuelle Fassung.
            </p>
          </section>

          <p className="text-base text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200 dark:border-slate-600">
            Stand: 10.03.2026
          </p>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
