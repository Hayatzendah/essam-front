import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { BRAND } from '../constants/brand';
import { useTranslation } from '../contexts/LanguageContext';

export default function AGBPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1">
            {t('agb_title')}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10" style={{ color: BRAND.red }}>
            {t('agb_subtitle')}
          </p>

          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 mt-8 first:mt-0">
              1. Vertragsgegenstand und Geltungsbereich
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Deutsch-Tests.com ist eine digitale Lernplattform für Deutschlernende und Prüfungskandidatinnen und Prüfungskandidaten. Die Plattform bietet Übungen, Trainingsformate, Tests und Lerninhalte zur Verbesserung der deutschen Sprachkenntnisse sowie zur gezielten Vorbereitung auf Deutschprüfungen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Das Angebot umfasst insbesondere Inhalte aus folgenden Bereichen:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>Leben in Deutschland Test</li>
              <li>Prüfungen</li>
              <li>Grammatik</li>
              <li>Grammatik-Training</li>
              <li>Wortschatz</li>
              <li>Der / Die / Das</li>
              <li>Lesen & Hören</li>
              <li>Dialoge</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Plattform richtet sich an Lernende der Niveaustufen A1 bis C1. Im Bereich „Prüfungen“ können insbesondere Inhalte zur Vorbereitung auf Formate wie Goethe, telc, ÖSD, ECL, DTB und DTZ bereitgestellt werden.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die auf der Plattform verfügbaren Inhalte umfassen insbesondere digitale Übungen, interaktive Aufgaben, Modelltests, Erklärungen, Lerntexte, Trainingsformate und sonstige Inhalte zur Sprachförderung und Prüfungsvorbereitung.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Ein Teil des Angebots kann kostenlos genutzt werden. Weitere Inhalte und Funktionen können eine Registrierung oder einen kostenpflichtigen Zugang voraussetzen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Diese Nutzungsbedingungen regeln die Nutzung der Plattform Deutsch-Tests.com, des Benutzerkontos sowie aller darüber bereitgestellten Inhalte und Leistungen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Für einzelne Angebote, Sonderaktionen oder zusätzliche Leistungen können ergänzende Bedingungen gelten. Soweit solche besonderen Bedingungen von diesen Nutzungsbedingungen abweichen, gehen die besonderen Bedingungen im jeweiligen Einzelfall vor.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Soweit auf der Plattform Inhalte, Verlinkungen oder Angebote Dritter eingebunden oder dargestellt werden, sind diese nicht Bestandteil unserer eigenen Leistungen. Für solche Angebote gelten ausschließlich die Bedingungen des jeweiligen Drittanbieters.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Änderungen der Nutzungsbedingungen
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wir behalten uns vor, diese Nutzungsbedingungen mit Wirkung für die Zukunft zu ändern, soweit hierfür ein sachlicher Grund besteht. Ein solcher Grund kann insbesondere bei gesetzlichen Änderungen, technischen Weiterentwicklungen, organisatorischen Anpassungen oder der Weiterentwicklung unseres Angebots vorliegen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Änderungen werden den Nutzerinnen und Nutzern rechtzeitig in geeigneter Form mitgeteilt, insbesondere per E-Mail an die im Benutzerkonto hinterlegte Adresse. Sofern den Änderungen nicht innerhalb von vier Wochen nach Zugang der Mitteilung widersprochen wird, gelten sie als angenommen. Auf das Widerspruchsrecht, die Frist und die Folgen eines unterlassenen Widerspruchs wird in der Mitteilung gesondert hingewiesen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Das Recht zur Kündigung bleibt hiervon unberührt.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              2. Benutzerkonto
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Für die Nutzung bestimmter Inhalte und Funktionen ist die Erstellung eines Benutzerkontos erforderlich. Im Rahmen der Registrierung sind die abgefragten Angaben vollständig und zutreffend anzugeben.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Nutzerinnen und Nutzer sind verpflichtet, ihre Daten, insbesondere ihre E-Mail-Adresse, aktuell zu halten. Die Kommunikation im Zusammenhang mit dem Benutzerkonto erfolgt grundsätzlich über die angegebene E-Mail-Adresse. Es ist sicherzustellen, dass Nachrichten von Deutsch-Tests.com empfangen werden können.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Das Benutzerkonto ist ausschließlich für die persönliche Nutzung bestimmt. Eine Weitergabe der Zugangsdaten an Dritte oder die Einräumung des Zugriffs an Dritte ist nicht gestattet.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Das gewählte Passwort ist vertraulich zu behandeln und vor dem Zugriff unbefugter Personen zu schützen. Besteht der Verdacht, dass ein Benutzerkonto unbefugt genutzt wurde, ist uns dies unverzüglich mitzuteilen.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Bei Anhaltspunkten für Missbrauch, unbefugte Nutzung oder Verstöße gegen diese Nutzungsbedingungen sind wir berechtigt, das betreffende Benutzerkonto vorübergehend zu sperren, bis der Sachverhalt geklärt ist.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Die Löschung des Benutzerkontos ist grundsätzlich über die Kontoeinstellungen möglich, sofern kein aktiver kostenpflichtiger Zugang und keine offenen Zahlungsverpflichtungen bestehen.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              3. Kostenlose und kostenpflichtige Nutzung
            </h2>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-6">
              Kostenlose Nutzung
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Ein Teil der Plattform kann kostenlos genutzt werden. Der genaue Umfang der kostenlosen Nutzung richtet sich nach dem jeweils aktuellen Angebot auf der Plattform.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Wir behalten uns vor, den Umfang kostenloser Inhalte und Funktionen jederzeit mit Wirkung für die Zukunft anzupassen, soweit dies für die Nutzerinnen und Nutzer zumutbar ist.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Kostenpflichtige Nutzung
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              Bestimmte Inhalte, Übungen, Tests oder Funktionen sind nur im Rahmen eines kostenpflichtigen Zugangs verfügbar. Es können insbesondere folgende Zugangsmodelle angeboten werden:
            </p>
            <ul className="list-disc list-inside space-y-1 text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 pl-2">
              <li>monatliches Abonnement</li>
            </ul>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Die jeweils aktuellen Leistungen, Preise, Laufzeiten und Zahlungsmöglichkeiten ergeben sich aus den Informationen auf der Plattform zum Zeitpunkt des Vertragsschlusses. Die Nutzung eines kostenpflichtigen Zugangs kann auf eine bestimmte Anzahl von Endgeräten beschränkt werden, sofern dies auf der Plattform entsprechend angegeben wird.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Vertragsschluss, Beginn und Laufzeit
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Ein kostenpflichtiger Vertrag kommt zustande, sobald der Bestellvorgang abgeschlossen wurde und die Zahlung erfolgreich bestätigt oder eingegangen ist. Die Laufzeit richtet sich nach dem jeweils gewählten Modell. Ein monatliches Abonnement verlängert sich automatisch um jeweils einen weiteren Monat, sofern es nicht rechtzeitig gekündigt wird. Zeitlich befristete Zugänge enden automatisch mit Ablauf der gebuchten Laufzeit, ohne dass es einer Kündigung bedarf.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Kündigung
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Ein monatliches Abonnement kann jederzeit gekündigt werden. Die Kündigung wird zum Ende des laufenden Abrechnungszeitraums wirksam. Bis zu diesem Zeitpunkt bleibt der Zugang in vollem Umfang bestehen. Die Kündigung erfolgt über die dafür vorgesehene Funktion im Benutzerkonto oder auf dem sonst auf der Plattform angegebenen Weg.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Zahlungen und Zahlungsverzug
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Zahlung für kostenpflichtige Zugänge erfolgt im Voraus. Bei einem Abonnement erfolgt die Abbuchung in den vereinbarten Abständen über die gewählte Zahlungsmethode. Kommt es zu fehlgeschlagenen Abbuchungen oder offenen Forderungen, sind wir berechtigt, weitere Zahlungsaufforderungen zu versenden und im gesetzlich zulässigen Rahmen geeignete Maßnahmen zur Durchsetzung unserer Ansprüche zu ergreifen. Bei offenen Forderungen können der Zugang zu kostenpflichtigen Inhalten vorübergehend eingeschränkt und einzelne Funktionen des Benutzerkontos bis zur vollständigen Begleichung des offenen Betrags ausgesetzt werden.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Preisänderungen
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wir behalten uns vor, Preise mit Wirkung für die Zukunft in angemessenem Umfang anzupassen, sofern hierfür ein sachlicher Grund besteht, insbesondere bei technischen, wirtschaftlichen oder rechtlichen Änderungen. Über Preisänderungen bei laufenden Abonnements informieren wir rechtzeitig vor ihrem Inkrafttreten. Das Recht zur Kündigung bleibt hiervon unberührt.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Erstattungen
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Bereits geleistete Zahlungen werden grundsätzlich nicht erstattet, soweit keine zwingenden gesetzlichen Vorschriften etwas anderes vorsehen oder im Einzelfall ausdrücklich etwas anderes vereinbart wurde.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Datenverarbeitung bei Zahlungen
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Zur Abwicklung von Zahlungen sowie zur Bearbeitung offener Forderungen können die hierfür erforderlichen Daten an Zahlungsdienstleister und gegebenenfalls an beauftragte Dienstleister übermittelt werden, soweit dies rechtlich zulässig ist. Weitere Informationen enthält die Datenschutzerklärung.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              4. Newsletter und Kommunikation
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Nutzerinnen und Nutzer können sich für den Newsletter von Deutsch-Tests.com anmelden. Über den Newsletter informieren wir insbesondere über neue Inhalte, Übungen, Funktionen, Angebote und sonstige Neuigkeiten im Zusammenhang mit der Plattform.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Einwilligung in den Erhalt des Newsletters ist freiwillig und kann jederzeit mit Wirkung für die Zukunft widerrufen werden. Die Abmeldung ist über den Abmeldelink in der jeweiligen E-Mail oder über die entsprechenden Einstellungen im Benutzerkonto möglich.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Von einer Abmeldung unberührt bleiben E-Mails, die für die Durchführung des Vertragsverhältnisses erforderlich sind, insbesondere Mitteilungen zum Benutzerkonto, zu Buchungen, Zahlungen, sicherheitsrelevanten Vorgängen oder wesentlichen Änderungen unseres Angebots.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              5. Nutzungsrechte
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Sämtliche auf der Plattform bereitgestellten Inhalte, insbesondere Übungen, Tests, Modellaufgaben, Texte, Erklärungen, Strukturen, Audioinhalte, Grafiken, Layouts und sonstige Materialien, sind urheberrechtlich oder anderweitig rechtlich geschützt.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Nutzung der Inhalte ist ausschließlich für persönliche, nicht kommerzielle Zwecke gestattet. Es ist nicht erlaubt, Inhalte ohne unsere ausdrückliche vorherige Zustimmung ganz oder teilweise zu vervielfältigen, zu verbreiten, öffentlich zugänglich zu machen, zu bearbeiten, zu verkaufen, an Dritte weiterzugeben oder anderweitig kommerziell zu verwerten.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Nicht gestattet ist insbesondere das systematische Kopieren, Speichern, Veröffentlichen oder Weiterverwenden von Inhalten zur Nutzung auf anderen Webseiten, Plattformen, in sozialen Netzwerken, in Apps, in Datenbanken oder in gedruckten oder digitalen Lehrmaterialien.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Bei Verstößen gegen diese Bestimmungen behalten wir uns vor, den Zugang vorübergehend zu sperren oder das Vertragsverhältnis außerordentlich zu beenden. Weitergehende gesetzliche Ansprüche bleiben unberührt.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              6. Widerrufsrecht bei digitalen Inhalten und digitalen Dienstleistungen
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Soweit Verbraucherinnen oder Verbrauchern bei kostenpflichtigen digitalen Inhalten oder digitalen Dienstleistungen ein gesetzliches Widerrufsrecht zusteht, richtet sich dieses nach den gesetzlichen Vorschriften.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Das Widerrufsrecht kann bei digitalen Inhalten oder digitalen Dienstleistungen vorzeitig erlöschen, wenn die Nutzerin oder der Nutzer ausdrücklich zustimmt, dass wir mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnen, und zugleich bestätigt, dass mit Beginn der Ausführung das Widerrufsrecht erlischt, soweit die gesetzlichen Voraussetzungen hierfür vorliegen. Das entspricht der gesetzlichen Regelung in § 356 BGB.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Einzelheiten zum Widerruf und zu den hierfür maßgeblichen Voraussetzungen werden im Rahmen des Bestellvorgangs gesondert mitgeteilt.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              7. Technische Verfügbarkeit und Weiterentwicklung
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wir bemühen uns um eine möglichst störungsfreie und dauerhafte Verfügbarkeit der Plattform. Eine jederzeit ununterbrochene Erreichbarkeit kann jedoch nicht gewährleistet werden.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Insbesondere können vorübergehende Einschränkungen oder Unterbrechungen aufgrund von Wartungsarbeiten, technischen Störungen, Sicherheitsupdates, Kapazitätsgrenzen oder sonstigen Umständen erforderlich sein.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Wir behalten uns vor, Inhalte, Funktionen und technische Merkmale der Plattform zu ändern, weiterzuentwickeln, zu ergänzen oder anzupassen, soweit dies aus technischen, rechtlichen, organisatorischen oder sicherheitsbezogenen Gründen erforderlich ist oder der Verbesserung des Angebots dient und den Nutzerinnen und Nutzern zumutbar ist.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              8. Haftung
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung die Nutzerin oder der Nutzer regelmäßig vertrauen darf. In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Die Haftung nach zwingenden gesetzlichen Vorschriften bleibt unberührt.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Soweit unsere Haftung ausgeschlossen oder beschränkt ist, gilt dies auch zugunsten unserer gesetzlichen Vertreterinnen und Vertreter, Mitarbeitenden und Erfüllungsgehilfen.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              9. Übertragung von Rechten und Pflichten
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Wir sind berechtigt, Rechte und Pflichten aus dem Vertragsverhältnis ganz oder teilweise auf Dritte zu übertragen, soweit dadurch berechtigte Interessen der Nutzerinnen und Nutzer nicht unangemessen beeinträchtigt werden.
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Sofern eine vollständige Übertragung des Vertragsverhältnisses erfolgt, werden wir hierüber rechtzeitig informieren. In diesem Fall besteht ein Recht zur Kündigung mit Wirkung zum Zeitpunkt des Übergangs.
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              10. Schlussbestimmungen
            </h2>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Salvatorische Klausel
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Sollte eine Bestimmung dieser Nutzungsbedingungen ganz oder teilweise unwirksam oder undurchführbar sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Anwendbares Recht
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit dem keine zwingenden gesetzlichen Vorschriften entgegenstehen.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Streitbeilegung
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Sofern wir Allgemeine Geschäftsbedingungen verwenden oder eine Website betreiben, bestehen nach § 36 VSBG grundsätzlich Informationspflichten zur Teilnahme an Verbraucherschlichtung; eine Ausnahme gilt für Unternehmer, die am 31. Dezember des Vorjahres zehn oder weniger Personen beschäftigt haben. Soweit keine gesetzliche Pflicht zur Teilnahme besteht und keine freiwillige Teilnahme erklärt wird, kann folgende Formulierung verwendet werden: Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Datenschutz
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Die Verarbeitung personenbezogener Daten erfolgt nach den geltenden datenschutzrechtlichen Vorschriften. Nähere Informationen enthält die Datenschutzerklärung.
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
