# Restore Google Shopping Tab

Diese Firefox-Erweiterung stellt den **Shopping**-Tab in den Google-Suchergebnissen wieder her. Sie orientiert sich am Open-Source-Projekt [Restore Google Maps Button](https://github.com/HeyAnto/restore-google-maps-button).

## Installation für die Entwicklung

1. Firefox öffnen und `about:debugging` aufrufen.
2. **Dieser Firefox** auswählen.
3. **Temporäres Add-on laden…** anklicken.
4. Die Datei `manifest.json` dieses Projekts auswählen.
5. Eine Google-Suche öffnen. Der Tab **Shopping** erscheint direkt neben **Bilder**.

Die Erweiterung verarbeitet nur die Google-Suchergebnisse auf den im Manifest eingetragenen Google-Domains. Über das Erweiterungs-Popup kann sie deaktiviert werden.

## Hinweis

Google kann das HTML und die Navigation seiner Suchseite jederzeit ändern. Falls Google die Struktur ändert, müssen die DOM-Selektoren im Content-Script angepasst werden.
