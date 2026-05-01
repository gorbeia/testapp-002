# Txosna — Sistema Gida

## Bazkideentzako eta Kudeaketarako Dokumentazioa

---

## Laburpena

Txosna euskal elkarteentzako diseinatutako janari eta edari eskaera kudeatzeko sistema bat da. Sistema honek txosnak (bazkideak eta bezeroak) karpetan eta jaialdietan ordenatzeko prozesua errazten du, eskaerak kudeatzeko, ordainketak prozesatzeko eta boluntarioen lan-antolakuntza hobetzeko.

---

## 1. Zer da Txosna?

Txosna sistemak honako abantailak eskaintzen dizkie:

- **Bezeroentzat**: Mugarik gabeko eskaera-sistema telefonoan
- **Boluntarioentzat**: Lan-karga arintzen duen tresna eraginkorra
- **Kudeaketarako**: Eskaera eta diru-sarreren kontrol osoa

### Onurak elkartearentzat

| Onura                   | Deskribapena                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| **Eraginkortasuna**     | Eskaerak automatikoki banatzen dira sukalde eta mostradoreetara       |
| **Errore gutxiago**     | Eskaerak modu digitalean hartzen dira, ez ahoz aho                    |
| **Ordainketa seguruak** | Esku-dirua eta txartelak onartzen ditu, Stripe edo Redsys integratuta |
| **Estatistikak**        | Eskaera kopuruak, diru-sarrerak eta produktu arrakastatsuak ikusgai   |
| **Hizkuntza anitzak**   | Euskara, gaztelania, frantsesa eta ingelesa                           |
| **Gastu txikia**        | VPS propioan exekutatzen da, €0/hileko kostu gehigarririk gabe        |

---

## 2. Pantaila Nagusiak

### 2.1 Bezeroaren Esperientzia

#### Menua Telefonoan

**Ezaugarriak:**

- Diseinu garbia eta erraza
- Produktuak kategorika antolatuak
- Prezio garbiak
- Itxaron-denbora ikusgai
- Gauezko modua

#### Eskaera Egiteko Prozesua

Bezeroak eskaera bat egiteko jarraitu beharreko pausoak:

##### 1. Menua arakatu

![Menua mugikorrean](../screenshots/06-customer-menu-mobile.png)

Bezeroak bere telefonoan sartzen du txosnaren URLa edo eskaneatzen du QR kodea. Pantailan ikusten du:

- **Kategoriak**: Janaria eta Edariak bereizita
- **Produktuen zerrenda**: Izena, prezioa, alergenoak, dieta-etiketak
- **Itxaron-denbora**: Zenbat minututan prest egongo den
- **Txosna egoera**: Irekita / Itxita / Pausatuta

##### 2. Produktua aukeratu

![Produktua aukeratu](../screenshots/13-product-selection-mobile.png)

Produktu batean sakatu eta hautatzeko pantaila irekitzen da:

**Aldaerak aukeratu:**

- Tamaina (adib: Normal / Handia)
- Albokoak (adib: Patatak / Entsalada)

**Gehigarriak gehitu:**

- Gazta (+1€)
- Barazkiak (+0.50€)
- Baratxuria (+0.30€)

**Osagaiak kendu:**

- Letxuga
- Tipula
- Tomatea

**Kantitatea**: Zenbat unitate nahi diren

##### 3. Saskia ikusi

![Saskia ikusi](../screenshots/14-cart-mobile.png)

Saskian bildutako produktuak ikusteko, saskia ikonoa sakatu beheko barran:

- Produktuen zerrenda argazkiekin
- Aldaerak eta gehigarriak bakoitzeko
- Kantitatea aldatu edo ezabatu
- Guztizko zenbatekoa kalkulatuta
- "Jarraitu" botoia ordainketara joateko

##### 4. Eskaera baieztatu

![Eskaera baieztapena](../screenshots/08-order-checkout-mobile.png)

**4 pauso erraz:**

1. **Menua arakatu** - Janari eta edarien zerrenda
2. **Aukeratu** - Produktuari klik egin eta gehitu
3. **Saskia ikusi** - Edizioak eta gehigarriak
4. **Ordaindu** - Online edo mostradorean

**Ordainketa aukerak:**

- **Online (Stripe/Redsys)**: Txartelarekin ordaindu telefonoan
- **Mostradorean**: Esku-diruz edo txartelaz bertan ordaindu

- Saskia ikonoa behean
- Ordainketa segurua Stripe/Redsys

#### Online Ordainketa Fluxua

"Telefonoa + Online ordainketa" kanala aktibo dagoenean, bezeroak eskaera baieztatzean online ordainketara bideratzen da automatikoki.

**Stripe bidez:**

1. Bezeroak "Online (Txartelarekin)" sakatu checkout pantailan
2. Sistema Stripe ordainketa-saio bat sortzen du
3. Bezeroa Stripe-ren ordainketa-orrialdera bideratzen da
4. Txartelarekin ordaindu ondoren, Stripe sistemari jakinarazten dio (webhook)
5. Sistema automatikoki eskaera baieztatzen du eta tiketak sukaldean agertzen dira
6. Bezeroa eskaeraren egoera orrialdera itzultzen da

**Redsys bidez (TPV Birtuala):**

1. Bezeroak "Online (Txartelarekin / Bizum)" sakatu checkout pantailan
2. Sistema Redsys ordainketa-saio bat sortzen du bankuaren TPV birtualerako
3. Bezeroa bankuaren ordainketa-orrialdera bideratzen da (Redsys)
4. Txartelarekin edo Bizum bidez ordaindu ondoren, bankuak sistemari jakinarazten dio
5. Sistema automatikoki eskaera baieztatzen du eta tiketak sukaldean agertzen dira
6. Bezeroa eskaeraren egoera orrialdera itzultzen da

> **Oharra**: Ordainketa-saioek 30 minutuko iraungipen-denbora dute. Denboran epean osatu ez bada, eskaera automatikoki baliogabetzen da eta bezeroak berriro hasi behar du.

#### Eskaera Egoera

![Eskaera egoera](../screenshots/08-order-status-mobile.png)

Bezeroak bere eskaeraren egoera ikusten du:

- ✅ Jasota (sukaldean)
- ⏳ Prestatzen
- 🔔 Prest (bildu)

**Push jakinarazpenak** eskuragarri prest denean.

**TicketBAI faktura** (txosnak TicketBAI gaituta duenean):

![Eskaera egoera faktura atalarekin](../screenshots/41-order-status-fiscal-invoice.png)

Faktura jaulkitzen denean, "**Txartel argia / Faktura**" sekzio bat agertzen da eskaera-egoera pantailan:

- **Faktura erreferentzia**: `TB-2026-00000001` formatuan (serie-urtea-zenbakia)
- **Data**: faktura jaulkitzeko ordua
- **"QR kodea ikusi"** botoia — Hazienda Vaskaren egiaztapen-orrira irekitzen da berriko fitxa batean

#### Frogagirria (Pickup Proof)

![Frogagirria](../screenshots/09-pickup-proof-mobile.png)

- Kontraste handiko pantaila
- Eskaera zenbakia handia
- QR kodea azkar frogatzeko
- Pantaila aktibo mantentzen da (WakeLock)

> **Oharra**: Bezeroak bere telefonoan frogagirria erakusten du, eta boluntarioak eskaera zenbakia edo QR kodea eskaneatzen du ordenatzeko.

#### Eskaeraren Jarraipen Mugikorra

**URL:** `/eu/[slug]/track`

`mobileTrackingEnabled` gaituta dagoenean, bezeroak kode soil batekin euren eskaeraren egoera ikusi dezakete telefono edo ordenagailutik, konturik sortu gabe.

**Sarrera orrialdea** (`/track`):

![Kode sarrera — eskaeraren jarraipena](../screenshots/38-track-entry-mobile.png)

- Kodea idazteko eremua (adib.: `AB-1234`)
- "Bilatu" botoiarekin eskaera aurkitu

**Egoera orrialdea** (`/track/[kode]`):

![Eskaera egoera — kodearen bidez jarraipena](../screenshots/39-track-status-mobile.png)

- Eskaeraren egungo egoera denbora errealean (SSE bidez)
- Janari eta Edarien tiketen egoera bereizita
- "Prest!" abisua denak biltzeko moduan daudenean
- "Deskargatu txartela" lotura frogagirri orrialdera

**Frogagirri orrialdea** (`/track/[kode]/receipt`):

![Txartela — inprimatzeko orrialdea](../screenshots/40-track-receipt-mobile.png)

- Txosna izena, data, eskaera zenbakia, bezeroaren izena
- Lerro bakoitzeko produktua eta prezioa
- Guztira
- "Inprimatu" botoia (nabigatzailearen inprimatze-leihoa)
- Ohar: "Ez da zerga-dokumentua"

> **Oharra**: Bezero guztiek erabili dezakete — txartelez, eskudiruz edo online ordaindu. CONFIRMED egoerara iristen denetik aurrera frogagirria deskargatzeko aukera dago.

#### Ordenatze Taula (Order Board)

![Ordenatze taula TVan](../screenshots/10-order-board-tv.png)

**Pantaila handietan erakusteko**:

- **Ezkerrean**: Prest dagoen eskaerak (berdea)
- **Eskuinean**: Prestatzen ari direnak (horia)
- Itxaron-denbora kalkulatua
- Automatikoki eguneratzen denbora errealean

---

### 2.2 Boluntarioen Pantailak

#### PIN Sarbidea

**URL:** `/eu/pin`

Boluntarioak sartzen diren lehenengo pantaila. PIN sinple bat erabiliz autentifikatzen dira eta dagokien pantailara bideratzen dira.

**Lau modu:**

| Modua         | Ikurra | Helmuga                                      |
| ------------- | ------ | -------------------------------------------- |
| **Janaria**   | 🍽     | Janari Mostradorea                           |
| **Edariak**   | 🍺     | Edari Mostradorea                            |
| **Sukaldea**  | 👨‍🍳     | KDS (postu hautaketarekin edo zuzenean)      |
| **Kudeaketa** | 📋     | Sukalde Kudeaketa (koordinatzaile ikuspegia) |

**Sukaldeko postu hautaketa:**

Txosnak sukaldeko postuak konfiguratuta baditu, **Sukaldea** modua aukeratzean eta PINa sartu ondoren, postu-hautaketa pantaila agertzen da. Boluntarioak bere lan-postua hautatzen du (adib. "Parrilla" edo "Muntaia") eta KDS-ak postu horretako tiketak bakarrik erakusten dizkio. "Kudeaketa (guztiak)" aukeratzean Sukalde Kudeaketa pantailara bideratzen da.

---

#### Sukaldea (KDS - Kitchen Display System)

![KDS sukaldea](../screenshots/11-kds-desktop.png)

Sukaldeko langileentzako pantaila nagusia. Bertan ikusten dira denbora errealean sartzen diren eskaera guztiak eta haien egoera.

##### Goiburua (Header)

**Ezkerrean:**

- **Gertaera hautatzailea**: "Aste Nagusia 2026 ▾" - Txosnak aukeratzeko menua
- **Eremua eta mota**: "Janaria · Sukaldea · ⚠ 1 motel" - Zein txosna eta zein sukalde motatan ari den lanean; postuak badaude eta postu bat hautatuta badago, postu-izena erakusten du (adib. "Janaria · parrilla")

**Eskuinean - Kudeaketa botoiak:**
| Ikonoa | Izena | Funtzioa |
|--------|-------|----------|
| 🌙 | Modu iluna | Pantaila argitasuna doitzeko (gauak/egunak) |
| 📦 Stocka | Stock kudeaketa | Produktuak agortuta markatzeko dialogoa irekitzen du |
| ⋯ Aukerak | Aukerak | Sukaldea pausatu/ireki/itxi eta bestelako ezarpenak |

##### Hiru Zutabe Sistema

Eskaerak hiru zutabean antolatuta daude, Kanban estiloko taula batean:

| Zutabea        | Kolorea   | Azalpena                                        | Ekintza                                      |
| -------------- | --------- | ----------------------------------------------- | -------------------------------------------- |
| **Jasota**     | 🟡 Horia  | Eskaera berriak, oraindik ez da prestatzen hasi | "→ Hasi" botoia sakatu prestatzen hasteko    |
| **Prestatzen** | 🔵 Urdina | Sukaldean lanean ari diren eskaerak             | "→ Prest" botoia sakatu prest dagoenean      |
| **Prest**      | 🟢 Berdea | Bukatutako eskaerak, bildu daitezke             | "→ Amaituta" botoia sakatu entregatu ondoren |

##### Eskaera Txartelak (Ticketak)

**Goiko informazioa:**

- **⬆ Hurrengoa**: Hurrengo eskaera prestatzeko adierazlea
- **#38**: Eskaera zenbakia (bezeroak ikusten duena)
- **Miren**: Bezeroaren izena
- **Jasota/Prestatzen/Prest**: Eskaeraren uneko egoera
- **⏱ 14min**: Zenbat denbora daraman prestatzen

**Produktuen zerrenda:**

- **2× Txorizoa ogian**: Kantitatea × Produktu izena
- **— patata frijituak**: Aldaera aukeratua (adibidez: albokoak)
- **✕ Tipula**: Kentzeko osagaia (bezeroak kendu duena)
- **📝 Burgerra ondo eginda**: Prestaketa argibideak

**Beheko botoiak:**

- **📖**: Argibideen ikonoa - Klik egitean produktuaren prestaketa argibideak ikusten dira
- **→ Hasi / → Prest / → Amaituta**: Eskaera hurrengo egoerara pasatzeko

**Jakinarazpen bereziak:**

- **🔔 Eskaera aldatua**: Bezeroak eskaera aldatu du eta sukaldeak berriro ikusi behar du

##### Stock Kudeaketa

Sukaldeko langileek 📦 Stocka botoia erabiliz produktuak agortuta marka ditzakete. Hau erabilgarria da:

- Ingredienteen stocka amaitzen ari denean
- Sukaldeak ezin duen produktu bat egiteko
- Menua aldi baterako murrizteko

##### Sukaldearen Egoera Aldaketa

**Aukerak** (⋯) botoian sakatu eta:

- **Pausatu sukaldea**: Eskaera berriak jaso ez (adib: atsedenaldia)
- **Itxi sukaldea**: Sukaldea itxi (adib: txosna itxita)
- **Ireki sukaldea**: Sukaldea berriro martxan jarri

---

##### Stock Kudeaketa Dialogoa

![Stock kudeaketa](../screenshots/19-kds-stock-dialog.png)

📦 Stocka botoia sakatzean, dialogo bat irekitzen da produktuak agortuta markatzeko:

**Produktuen zerrenda:**

- Produktu bakoitzaren izena eta egoera
- **Agortuta** / **Eskuragarri** toggle botoiak
- Bilaketa barra produktuak aurkitzeko
- Kategoriaka antolatuta (Janaria / Edariak)

**Agortze arrazoiak:**

- Ingredienteen eskasia
- Sukaldeko arazoak
- Eskaera gehiegia (denbora batez)

##### Prestaketa Argibideen Dialogoa

![Prestaketa argibideak](../screenshots/20-kds-instructions-dialog.png)

📖 ikonoa sakatzean, produktuaren prestaketa argibideak ikusteko dialogoa irekitzen da:

**Fitxak:**
| Fitxa | Edukia |
|-------|--------|
| **Argibideak** | Sukaldeko langileentzako jarraibide detallatuak |
| **Alergenoak** | Produktuaren alergenoen zerrenda |
| **Bestelakoak** | Dieta-etiketak, osagaien zerrenda |

**Markdown onarpena:**

- Testu lodia, etzana
- Zerrendak
- Koloreko testua

##### Sukaldea Pausatu/Itxi Dialogoak

![Sukaldea pausatu](../screenshots/21-kds-pause-dialog.png)

**Aukerak** (⋯) menuan sukaldearen egoera aldatzeko aukerak:

**1. Pausatu sukaldea:**

- Eskaera berriak automatikoki baztertzen ditu
- "Itzuli laster" mezua erakusten du bezeroei
- Sukaldean atsedenaldiak hartzeko erabilia
- Eskaera aktiboak prestatzen jarraitzen dira

**2. Itxi sukaldea:**

- Txosna guztiz itxita dagoela adierazten du
- "Itxita" mezua erakusten du bezeroei
- Eskaera berriak onartzen ez ditu
- Barne kudeaketa soilik

**3. Ireki sukaldea:**

- Sukaldea normaltasunera itzultzen du
- Eskaera berriak berriro onartzen ditu
- Denbora errealean eguneratzen da

---

#### Sukalde Kudeaketa (Kitchen Manager)

**URL:** `/eu/kitchen-manager`

Koordinatzailearen ikuspegi orokorra, sukaldeko postu guztiak estaltzen dituena. Postuak dituzten txosnentzako diseinatuta dago.

![Sukalde Kudeaketa — koordinatzaile ikuspegi orokorra](../screenshots/34-kitchen-manager.png)

**Goiburua:**

- Txosna-izena eta egoera-zenbatzaileak:
  - 🍳 **Sukaldean**: oraindik prest ez dauden eskaerak
  - ✅ **Jasotzeko**: postu guztiak PREST dituzten eskaerak
- 📦 **Stock** botoia: produktuak agortzeko/aktibatzeko

**Eskaera Txartelak:**

Txartel bakoitzak ordena bat irudikatzen du:

| Elementua            | Deskribapena                                                    |
| -------------------- | --------------------------------------------------------------- |
| **#42 Miren**        | Ordena zenbakia eta bezeroaren izena                            |
| **Progresio-barra**  | Postu kopuruaren arabera PREST ehunekoa (anbarra → berdea)      |
| **Postu errenkadak** | Postu bakoitzeko egoera-etiketa (Jasota / Prestatzen / Prest ✓) |
| **Txartel berdea**   | Postu guztiak PREST — bilketa-deia egiteko prest                |

**Ordenaketa:**

1. Prest dauden eskaerak lehenago (jasotzeko deia egin behar zaienak)
2. Zaharrenetik berrienera gainerakoak

**Onurak:**

- Koordinatzaileak ikustarazten du zein postu gelditzen diren eskaera bakoitzeko
- Txartel berdeak argi adierazten du bezeroari deia egiteko unea
- Irakurtzeko bakarrik: egoera aldaketak sukaldekoek egiten dituzte beren KDS-tik
- Denbora errealean eguneratzen da SSE bidez — orria freskatu gabe

---

#### Mostradorea

**Janari Mostradorea:**

![Janari Mostradorea](../screenshots/12-counter-food-v2.png)

**Edari Mostradorea:**

![Edari Mostradorea](../screenshots/12-counter-drinks.png)

**Ordainketa-prozesua (ordainketa zain):**

![Ordainketa zain](../screenshots/12-counter-food-pending-payment.png)

Mostradorean ordainketa zain dagoen eskaera bat kobratzeko:

1. **Hautatu eskaera** - "ORDAINKETARIK GABE" zerrendatik
2. **Sartu kopurua** - Ordaindutako diru-kopurua (trukerako kalkulatzeko)
3. **Egin klik** - "Ordaindu · Sukaldera bidali" botoian

**Eskaerak kudeatzeko:**

- Telefono-eskariak onartu
- Eskaerak editatu
- Prest dagoen eskaerak markatu
- Itxaron-denbora kalkulatua
- Zenbatzeko makina integratua

Boluntarioek mostradore edo sukalde bat hautatzen dute saioa hasteko.

**Eskualdatze txartela (mobileTrackingEnabled gaituta):**

Eskaera baieztatzen denean, pantaila osoko txartel bat agertzen da bezeroarentzat:

- Eskaera kodea letra handiz (adib.: `AB-1234`)
- QR kodea telefonoarekin eskaneatzeko (zuzenean eskaeraren egoera orrialdera doa)
- URL testuan (`/[slug]/track`) geroago idazteko
- "Itxi" botoia boluntarioak baztertzeko

**Bukatutako eskaerak panela:**

Pantailaren behean, tolestutako panel bat eskuragarri dago, bezeroak frogagiri URLa eskatzera itzultzen badira:

- Saioko azken 20 eskaera erakusten ditu (eskaera zenbakia, izena, kodea, QR txikia)
- QR txikian sakatzeak pantaila osoko ikuspegi handituarekin zabaltzen du
- Kanpoko lotura ikonoak eskaeraren jarraipen orrialdea irekitzen du

---

### 2.3 Kudeaketa Panela (Admin)

![Txosnak zerrenda](../screenshots/01-txosnak-list.png)

**Funtzio nagusiak:**

- Elkartearen txosna guztiak ikusi eta kudeatu
- Eskaera kopuruak eta diru-sarrerak denbora errealean
- Txosna bakoitzaren egoera: irekita, geldituta edo itxita
- Konfigurazio azkarra: menua, eskaerak, txostenak

#### Menu Kudeaketa

![Menu kudeaketa](../screenshots/02-menu-management.png)

- **Kategoriak**: Janaria eta Edariak antolatu
- **Produktuak**: Izena, deskribapena, argazkia, alergenoak
- **Aukerak**: Tamaina, albokoak, osagai gehigarriak
- **Prezioak**: Txosna bakoitzeko prezio bereziak ezarri

**Produktu bat editatzea:**

Produktu bat editatzeko, editatu nahi den elementuaren ondoko ✏️ ikonoa sakatu. Editatzeko leihoak 4 fitxa ditu:

##### 1. Oinarrizkoa fitxa

![Oinarrizko fitxa](../screenshots/15-product-tab-basic.png)

Fitxa honetan produktuaren oinarrizko datuak konfiguratzen dira:

| Eremua                | Deskribapena                                                      | Adibidea                           |
| --------------------- | ----------------------------------------------------------------- | ---------------------------------- |
| **Izena**             | Produktuaren izena                                                | "Gazta Burgerra"                   |
| **Deskribapena**      | Bezeroarentzako azalpena                                          | "Etxeko burgerra gaztarekin..."    |
| **Prezio lehenetsia** | Oinarrizko prezioa                                                | 9.50 €                             |
| **Kategoria**         | Janaria edo Edariak                                               | Janaria                            |
| **Sukaldeko postua**  | Zein postura bideratzen den produktu hau (txosnak postuak baditu) | "plantxa", "muntaia"… edo Orokorra |
| **Prestatu behar da** | Sukaldean prestatzen den ala ez                                   | ✓ Bai (burgerra) / ✗ Ez (edaria)   |
| **Banatu daiteke**    | Hainbat pertsonatan banatu daitekeen                              | ✓ Bai (pintxo-sorta)               |
| **Adin-muga**         | +18 adina behar duen produktua                                    | ✓ Bai (alkoholdun edariak)         |
| **Osagaiak**          | Barruan dituen osagaien zerrenda                                  | Haragia, ogia, tomatea...          |

> **Sukaldeko postua**: hautatzailea soilik agertzen da txosnak postuak konfiguratuta dituenean (Sukaldea fitxan). "Orokorra" hautatuz gero, produktuaren tiketak postu guztietara bidaliko dira.

![Produktuaren oinarrizko fitxa — sukaldeko postua](../screenshots/36-menu-product-kitchenpost.png)

**Alergenoak** (14 europar alergeno):
🌾 Glutena · 🥛 Laktosa · 🥚 Arrautzak · 🥜 Kakahueteak · 🌰 Fruitu lehorrak · 🦐 Moluskuak · 🐟 Arrainak · 🐚 Zizka-mizka · 🍺 Sesamoa · 🌿 Zesamoa · 🍎 Sulfuroak · 🦆 Apioa · 🐑 Mostaza · 🍇 Lupinua

**Dieta-etiketak**:

- **V** - Begetariano (barazkiak + esnekiak/arrautzak)
- **VG** - Beganoa (barazkiak soilik)
- **GF** - Glutenik gabe
- **H** - Halal

##### 2. Aldaerak fitxa

![Aldaerak fitxa](../screenshots/16-product-tab-variants.png)

Produktuak tamaina edo aukera desberdinak baditu:

| Eremua                        | Deskribapena                                          | Adibidea                                           |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| **Aldaera taldea**            | Aldaera motaren izena                                 | "Albokoak"                                         |
| **Aukerak**                   | Aukera bakoitza eta bere prezioa                      | "Patata frijituak" (+0€), "Entsalada" (+0.50€)     |
| **Aukera — sukaldeko postua** | Aukera hori hautatuz gero zein postura bideratzen den | "muntaia", "freibidea"… edo produktuarena heredatu |

Produktu batek hainbat aldaera talde izan ditzake (adib: "Tamaina" + "Albokoak").

![Aldaerak fitxa — aukera bakoitzeko sukaldeko postua](../screenshots/37-menu-variant-kitchenpost.png)

> Aukera baten postua ezartzeak produktuaren postua gainidazten du lerro horretan. Eskaera batek postu bat baino gehiago ukitzen baditu (adib. produktua _plantxa_, aukera _muntaia_), bi tiketetan agertuko da lerro hori — bata postu bakoitzean.

##### 3. Gehigarriak fitxa

![Gehigarriak fitxa](../screenshots/17-product-tab-modifiers.png)

Bi motatako gehigarriak:

**Gehigarriak (prezio gehigarriekin):**

- Produktuari gehitu daitezkeen aukerak
- Prezioa alda dezakete
- Adibideak: Gazta (+1€), Barazkiak (+0.50€), Baratxuria (+0.30€)

**Kengarriak (preziorik gabe):**

- Bezeroak eskaeraren unean ken ditzakeen osagaiak
- Ez dute preziorik aldatzen
- Adibideak: Letxuga, Tipula, Tomatea

##### 4. Prestaketa fitxa

![Prestaketa fitxa](../screenshots/18-product-tab-prep.png)

**Prestaketa argibideak:**

- Sukaldeko langileentzako jarraibideak
- KDS (Kitchen Display System) pantailan agertzen dira
- Markdown sintaxia onartzen du
- Adibideak: "Patatak bi aldiz frijitu", "Burgerra ondo egosi", "Entsalada azkenik gehitu"

#### Boluntarioen Kudeaketa

![Boluntarioak](../screenshots/03-volunteers.png)

- Boluntarioen kontuak sortu eta kudeatu
- Rolak esleitu: ADMIN edo VOLUNTEER
- Pasahitzak berrezarri
- Jarduera ikusi

#### Txosna Konfigurazioa

Txosna bakoitzak konfigurazio propioa du, 5 fitxatan antolatuta:

##### 1. Orokorra fitxa

![Txosna konfigurazioa - Orokorra](../screenshots/22-txosna-settings-general.png)

**Ezarpen orokorrak:**

- **Egoera**: Irekita / Geldituta / Itxita
- **Itxaron denbora**: Zenbat minututan prest egongo den eskaerak
- **Boluntario PIN**: Sukaldera sartzeko beharrezko PIN kodea

##### 2. Ordainketa fitxa

![Txosna konfigurazioa - Ordainketa](../screenshots/23-txosna-settings-payment.png)

**Onartzen diren ordainketa metodoak:**

| Metodoa    | Deskribapena                                                      |
| ---------- | ----------------------------------------------------------------- |
| **CASH**   | Esku-dirua - Kudeaketa sinplea                                    |
| **STRIPE** | Txartelarekin online (Stripe) - Nazioartekoa, konfigurazio erraza |
| **REDSYS** | Txartelarekin online (Redsys) - Espainiarra, Bizum onartzen du    |

##### 3. Eskaerak fitxa

![Txosna konfigurazioa - Eskaerak](../screenshots/24-txosna-settings-orders-v2.png)

**Eskaera kanalak:**

| Kanala                                                | Deskribapena                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Mostradorea (COUNTER)**                             | Bezeroa bertan eskatzen du eta ordaintzen du                                    |
| **Telefonoa + Online ordainketa (PHONE_ONLINE)**      | Bezeroak bere telefonoarekin eskatzen du eta Stripe/Redsys bidez ordaintzen du  |
| **Telefonoa + Mostradore ordainketa (PHONE_COUNTER)** | Bezeroak telefonoarekin eskatzen du baina mostradorean ordaintzen du esku-diruz |

> **Oharra**: Kanal bat baino gehiago gaitu daitezke aldi berean.

**Mostradore konfigurazioa:**

- **Bakarra (SINGLE)**: Janaria eta edariak mostradore berean jasotzen dira (txosna txikiak)
- **Banatua (SEPARATE)**: Janaria eta edariak bananduta jasotzen dira (txosna handiak)

**Beste ezarpenak:**

| Ezarpena                          | Azalpena                                                                 | Balio lehenetsia                |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------- |
| **Ordainketa zain denbora-muga**  | Zenbat minututan bertan behera uzten den ordainketa osatu gabeko eskaera | 15 minutu (1-120 minutu artean) |
| **Sukaldeko txartelak inprimatu** | Eskaerak sukaldera bidaltzean txartelak automatikoki inprimatu           | Desgaituta                      |

##### 4. Sukaldea fitxa

![Txosna konfigurazioa - Sukaldea](../screenshots/35-txosna-settings-kitchen-posts.png)

**Sukaldeko postuak kudeatzeko CRUD interfazea:**

- **Zerrenda**: Konfiguratutako postu guztiak ikusgai, bakoitzak ✏️ (aldatu izena) eta ✕ (ezabatu) botoiekin
- **Aldatu izena**: ✏️ botoiak lerro horretan testu-eremu bat irekitzen du; Enter edo ✓ sakatu baieztatzeko, Escape uzteko
- **Postu berria**: Beheko testu-eremuan idatzi eta "+ Gehitu" sakatu (Enter ere funtzionatzen du)
- **Gorde**: PATCH bidez gordetzen da zerrendak

Postuak hutsik utziz gero, sukaldea estazio bakarrekoa da (tiketa bakarra eskaera guztientzat). Postuak gehituz gero:

- PIN sarreran postu-hautaketa pantaila agertzen zaie boluntarioei
- Eskaeren janari-lerroak postu egokiei bideratzen zaizkie automatikoki
- KDS-ak postu horretako tiketak bakarrik erakusten ditu
- Menu editorean produktu eta aldaera bakoitzari postu bat esleitu daiteke

##### 5. QR kodea fitxa

![Txosna konfigurazioa - QR kodea](../screenshots/25-txosna-settings-qr.png)

**Bezeroentzako eskaera esteka:**

Fitxa honek txosnara sartzeko esteka partekatzeko aukera ematen du. Bezeroek esteka hau erabil dezakete eskaerak egiteko:

- **QR kodea**: Bezeroek telefonoarekin eskaneatu dezaketen QR kodea
- **Esteka kopiatu**: URLa kopiatu eta partekatu (WhatsApp, sare sozialak, etab.)

Adibidez: `https://txosna.app/eu/aste-nagusia-2026`

> **Oharra**: Esteka hau txosna bakoitzarentzat bakarra da eta bezeroak zuzeneko eskaerak egiteko aukera ematen du.

**Jarraipen mugikorra:**

| Ezarpena                | Azalpena                                                                                    | Balio lehenetsia |
| ----------------------- | ------------------------------------------------------------------------------------------- | ---------------- |
| **Jarraipen mugikorra** | Bezeroak kode baten bidez euren eskaeraren egoera ikusi eta frogagirria deskargatu dezakete | Desgaituta       |

Gaituta dagoenean:

- Mostradore pantailan eskaera baieztatzen denean eskualdatze-txartela agertzen da (kodea + QR)
- `/[slug]/track` URL publikoa aktibo geratzen da
- Bukatutako eskaerak panela mostradore pantailan ikusgai dago
- Txartela deskargatzeko esteka: `https://txosna.app/eu/[slug]/track/[kode]/receipt`

##### Txosnako Produktuen Kudeaketa

![Txosnako produktuak](../screenshots/26-txosna-products.png)

Txosna bakoitzean produktuen kudeaketa independentea dago. Orri honetan:

- **Produktuen zerrenda**: Txosnako produktu guztiak ikusi eta bilatu
- **Gaitu/Desgaitu**: Aukeratu zein produktu eskainiko diren txosna honetan
- **Stock egoera**: Produktu bakoitzaren eskuragarritasuna kontrolatu (agortuta / eskuragarri)
- **Prezioak**: Txosna bakoitzeko prezio bereziak ezarri

**Produktuak gaituta:**

![Produktuak gaituta](../screenshots/26-txosna-products-enabled.png)

Produktuak gaitu eta konfiguratzeko, aktibatu etengailua eta egin klik "Editatu" botoian:

- ✅ **Gaituta** - Produktua txosna honetan eskaintzen da
- ⚙️ **Editatu** - Ireki ezarpenen dialogoa

**Produktuen ezarpenak txosnako:**

![Produktu ezarpenak txosnako](../screenshots/26-txosna-product-override-dialog.png)

Produktu bat txosna batean gaitzean, hurrengo ezarpenak alda daitezke:

| Ezarpena             | Azalpena                                                            |
| -------------------- | ------------------------------------------------------------------- |
| **Gaituta**          | Produktua txosna honetan eskaintzen den ala ez                      |
| **Prezioa**          | Prezio orokorra gainidatzi (hutsik utzi balio orokorra erabiltzeko) |
| **Stock kantitatea** | Eska daitekeen kopuru maximoa (0 = mugarik gabe)                    |
| **Sukaldea**         | Produktu hau sukaldera bidaltzen den ala ez                         |
| **Itxaron denbora**  | Berezko prestaketa denbora (minututan)                              |

> **Oharra**: Produktu berri bat gehitzeko edo aldatzeko, orokorrean menu kudeaketa erabili (➡️ [Menu Kudeaketa](#menu-kudeaketa)).

#### Elkartearen Ordainketa Ezarpenak

![Elkartearen ordainketa ezarpenak](../screenshots/27-association-payment-settings.png)

Elkarte mailan ordainketa metodo globalak konfiguratu daitezke. Orri honetan:

**Stripe konfigurazioa:**

- **Public Key**: Stripe kontuko `pk_live_...` gakoa
- **Secret Key**: Stripe kontuko `sk_live_...` gakoa
- Stripe webhook endpoint konfiguratu behar da Stripe dashboard-ean: `https://txosna.app/api/payments/webhook/stripe`

**Redsys konfigurazioa:**

- **Merchant Code (FUC)**: Redsys merkataritza kodea (adib. `327123456`)
- **Terminal Number**: Terminal zenbakia (adib. `1`)
- **Commerce Secret (SHA256)**: SHA256 giltza (Redsys admin paneletik eskuratzen da)
- **Entorno**: Probak/Sandbox (`sis-t.redsys.es`) edo Produkzioa (`sis.redsys.es`)
- **Bizum**: Gaituta badago, Bizum ordainketa-aukera automatikoki agertzen da bezeroari bankuaren TPV pantailan (ez da konfigurazio gehigarririk behar)

> **Redsys webhook**: Stripe ez bezala, Redsys-en jakinarazpen URLa transakzio bakoitzean automatikoki pasatzen da. Ez da webhook URL-rik aldez aurretik erregistratu behar Redsys admin panelean.

> **Oharra**: Online ordainketak gaitzeko, gutxienez metodo bat (Stripe edo Redsys) konfiguratu behar da elkarte mailan, eta txosna bakoitzean gaitu ordainketa fitxan.

#### TicketBAI Fakturara Nola Heldu — Bezeroaren Ibilbidea

Fakturara heltzeko bi bide daude, eskaera-kanala eta txosna-konfigurazioa kontuan hartuta:

---

##### Bide 1 — Telefono-eskaera (Phone-to-counter / Self-service)

Bezeroak bere telefonoarekin eskaera egin badu, eskaera baieztatzen den unean bertan fakturaren berri ematen da:

```
Bezeroak eskaera egiten du (telefonoa)
          │
          ▼
Eskaera Egoera pantaila → /eu/order/[id]
          │
          ▼
"Txartel argia / Faktura" sekzioa agertzen da automatikoki
  ┌─ Faktura erreferentzia (TB-2026-00000001)
  ├─ Data
  └─ "QR kodea ikusi →" botoia → Hazienda Vasca
```

Ez da ekintza gehigarririk behar: faktura eskaera-egoera pantailan bertan dago.

---

##### Bide 2 — Mostradoreko eskaera (Counter) + Jarraipen mugikorra

Mostradorean eskaera hartu bada, boluntarioak kode laburra ematen dio bezeroari. Bezeroak kode horrekin bere fakturara hel daiteke:

```
Boluntarioak mostradorean eskaera baieztatzen du
          │
          ▼
Eskualdatze txartela agertzen da boluntarioaren pantailan:
  ┌─ Kode alfanumerikoa letra handiz  (adib. AB-1234)
  ├─ QR kodea → /eu/[slug]/track/AB-1234
  └─ URL testuan: /[slug]/track
          │
          ▼  (Bezeroak QR eskaneatu edo kodea idatzi)
          │
          ▼
Eskaera-jarraipena pantaila → /eu/[slug]/track/AB-1234
  ┌─ Egoera-txartelak (Janaria / Edariak)
  ├─ "Zure eskaera prest dago!" barra (denak prest direnean)
  ├─ "Txartel argia / Faktura" sekzioa  ← faktura hemen
  │    ├─ Faktura erreferentzia (TB-00000042)
  │    ├─ Data
  │    └─ "QR kodea ikusi →" → Hazienda Vasca
  └─ "↓ Deskargatu txartela" botoia
```

![Eskualdatze txartela boluntarioaren pantailan](../screenshots/42-counter-handoff-card.png)

![Eskaeraren egoera kode bidez — TicketBAI fakturarekin](../screenshots/43-track-status-with-invoice.png)

**Boluntarioaren zeregina:**

1. Eskaera baieztatzen du mostradorean
2. Eskualdatze txartela agertzen da automatikoki — ez da ezer konfiguratu behar
3. QR kodea erakusten dio bezeroari eskaneatzeko **edo** kodea (adib. `AB-1234`) ematen dio ahoz
4. "Itxi" klikatu eta mostradorera itzultzen da

> **Oharra**: Mostradoreko jarraipena txosna bakoitzeko konfiguratzen da (`Ezarpenak → QR kodea fitxa → Jarraipen mugikorra`). Desgaituta badago, ez da txartelik agertuko eta bezeroak ez du eskaera jarraipena izango.

---

##### Txartela inprimatzea — Faktura barnean

Bezeroek `/track/[kode]/receipt` orrialdetik inprimagarria deskarga dezakete. TicketBAI gaituta dagoenean, txartelak zuzenean faktura-erreferentzia eta QR URL barne hartzen ditu:

- Faktura-erreferentzia (adib. `TB-00000001`)
- QR URL testuan inprimatu (eskaneatuz Hazienda Vaskara doa)
- TicketBAI gabe: "Ez da zerga-dokumentua" oharra

---

#### TicketBAI Faktura Liburua

**URL:** `/eu/ticketbai`

![TicketBAI faktura liburua](../screenshots/40-ticketbai-invoice-ledger.png)

Elkartearen faktura fiskal guztiak biltzen ditu: TicketBAI araudi fiskala betetzen duten agiriak.

**Taula-zutabeak:**

| Zutabea          | Deskribapena                                                 |
| ---------------- | ------------------------------------------------------------ |
| Faktura zenbakia | `TB-00000001` formatuan (serie + zenbakia 8 digitura beteta) |
| Eskaera          | Lotutako eskaera-zenbakia (`#42` moduan)                     |
| Data             | Faktura jaulkitzeko ordua eta data                           |
| Guztira          | Fakturatutako zenbatekoa euroak                              |
| Egoera           | MOCK · SUBMITTED · ACCEPTED · REJECTED (kolorez bereizita)   |
| QR               | Hazienda Vaskaren egiaztapen-orrira lotura                   |

**Hutsik dagoenean:** "Oraindik ez da fakturik jaulki" mezua, Ezarpenetara lotura batekin TicketBAI gaitzeko.

> **Nota legala**: Faktura liburua erregistro iraunkor gisa jokatzen du. Fakturak hornitzaile batekin jaulkitzen diren arren, liburuak faktura guztiak gordetzen ditu hornitzaile-aldaketa edota kontraktu-amaiera baten ondoren ere. Auditoria baterako eskatu ahal izango da.

#### TicketBAI Konfigurazioa

**URL:** `/eu/settings` → **BEZ** fitxa

TicketBAI konfiguratzeko, joan **Ezarpenak → BEZ** fitxara.

![Ezarpenak — BEZ fitxa TicketBAI desgaituta](../screenshots/38-settings-bez-tab.png)

**Aktibatzeko:**

1. "**TicketBAI gaitu**" toggle botoia piztu
2. Konfigurazio-panela agertzen da:

![Ezarpenak — BEZ fitxa TicketBAI gaituta](../screenshots/39-settings-bez-ticketbai-enabled.png)

| Ezarpena             | Azalpena                                                        | Balio lehenetsia |
| -------------------- | --------------------------------------------------------------- | ---------------- |
| **Faktura seriea**   | Faktura-zenbakien aurrizkia (adib. `TB` → `TB-2026-00000001`)   | `TB`             |
| **Hornitzailea**     | API hornitzailea fakturak jaulkitzeko; oraingoz "Mock (Probak)" | Mock             |
| **Konexioa probatu** | API konexioa egiaztatzen du faktura errealak sortu baino lehen  | —                |

3. "**Gorde konfigurazioa**" klikatu
4. Hemendik aurrera, eskaera baieztatzen den bakoitzean faktura bat automatikoki jaulkitzen da

> **Oharra**: "Mock (Probak)" hornitzailea probetarako soilik da. Hornitzaile erreal batek (Argi, etab.) fakturak Hazienda Vaskara bidaltzen ditu benetan. Hornitzaile berri bat gehitzeko, jarri harremanetan garatzailearekin.

#### Txostenak

![Txostenak](../screenshots/05-reports.png)

- Eskaera kopuruak denbora tartean
- Diru-sarrerak egun, aste edo hilabete kaibana
- Produktu arrakastatsuenak
- Bertan behera utzitako eskaerak eta arrazoiak

---

### 2.4 Sistema Oinarrizkoak

#### Saioa Hasi

![Login](../screenshots/13-login.png)

**2 pausoko prozesua:**

1. **Elkartea hautatu** — Elkartearen izena idatzi eta "Jarraitu" sakatu
2. **Kredentziakak sartu** — Posta elektronikoa eta pasahitza

- Pasahitza berrezarri aukera
- Segurtasun-tokenak

---

## 3. Eskaera Bizitza Zikloa

### Mostradore eta Telefonoa + Mostradore ordainketa

```
Bezeroa                 Sistema                    Sukaldea/Mostradorea
   |                       |                              |
   |  Eskaera egin         |                              |
   |---------------------->|                              |
   |                       |  Eskaera sortu               |
   |                       |  Tiketak sortu               |
   |  Eskaera baieztatua   |                              |
   |<----------------------|                              |
   |                       |----------------------------->|
   |                       |  Eskaera jaso                 |
   |                       |                              |
   |                       |                              |  Prestatzen
   |                       |<-----------------------------|
   |                       |  Prest                        |
   |  Jakinarazpena        |                              |
   |<----------------------|                              |
   |                       |                              |  Entregatu
   |                       |<-----------------------------|
   |                       |  Amaituta                     |
```

### Telefonoa + Online ordainketa (Stripe / Redsys)

```
Bezeroa                 Sistema                    Stripe / Redsys
   |                       |                              |
   |  Eskaera egin         |                              |
   |  (ZAIN_ORDAINKETA)    |                              |
   |---------------------->|                              |
   |                       |  Ordainketa-saio sortu       |
   |                       |----------------------------->|
   |  Bideratu ordainketara|  Saio URLa itzuli            |
   |<----------------------|                              |
   |  Ordaindu bankuan     |                              |
   |---------------------------------------------->|
   |                       |  Webhook jakinarazpena       |
   |                       |<-----------------------------|
   |                       |  BAIEZTATUA                  |
   |                       |  Tiketak sortu               |
   |  Ordainketa baieztatua|                              |
   |<----------------------|                              |
   |                       |  Sukaldean agertzen da       |
```

> Ordainketa 30 minututan osatu ezean, eskaera automatikoki **BALIOGABETUA** egoeran geratzen da.

### Egoerak:

1. **ZAIN_ORDAINKETA** (online ordainketa zain; mostradore eskaerak zuzenean 2ra)
2. **BAIEZTATUA** → Tiketak sortzen dira eta sukaldean agertzen dira
3. **JASOTA** → Sukaldean jasota
4. **PRESTATZEN** → Sukaldean lanean
5. **PREST** → Bildu dezakezu
6. **AMAITUTA** → Entregatuta
7. **BALIOGABETUA** → Ordainketa denboran osatu ez, edo bertan behera utzi

---

## 4. Konfigurazio Aukerak

### 4.1 Mostradore Mota

| Mota        | Deskribapena                         | Onura                        |
| ----------- | ------------------------------------ | ---------------------------- |
| **Bakarra** | Janari eta edariak mostradore berean | Txikia, talde txikientzako   |
| **Banatua** | Janaria eta edariak bananduta        | Azkarragoa, lan-fluxua hobea |

### 4.2 Eskaera Kanalak

- **Mostradorea**: Bezeroa bertan eskatzen du eta ordaintzen du
- **Telefonoa + Online ordainketa**: Bezeroak bere telefonoarekin eskatzen du eta bertan ordaintzen du (Stripe/Redsys)
- **Telefonoa + Mostradore ordainketa**: Bezeroak telefonoarekin eskatzen du baina mostradorean ordaintzen du esku-diruz

### 4.3 Ordainketa Metodoak

- **Esku-dirua**: Kudeaketa sinplea
- **Txartela**: Stripe edo Redsys integratua
  - Stripe: Nazioartekoa, konfigurazio erraza
  - Redsys: Espainiarra, Bizum onartzen du

---

## 5. Alergenoak eta Dieta Bereziak

Sistemak 14 alergeno europar identifikatzen ditu:

- Glutena, laktosa, arrautzak, fruitu lehorrak...
- Dietak: begetariano, begetariano, glutenik gabe, halal
- Bezeroak ikusten ditu eskaera egin aurretik
- Sukaldeak ikusten ditu preparazioan

---

## 6. Teknologiaren Laburpena

| Osagaia    | Teknologia               |
| ---------- | ------------------------ |
| Framework  | Next.js 16               |
| Hizkuntza  | TypeScript               |
| Datu-basea | PostgreSQL               |
| ORM        | Prisma                   |
| Estiloa    | Tailwind CSS             |
| UI         | Shadcn/ui + Radix        |
| Real-time  | SSE (Server-Sent Events) |
| Hosting    | VPS propioa              |

---

## 7. Hizkuntzak

Sistema lau hizkuntzetan eskuragarri:

- 🇪🇺 **Euskara** (lehenetsia)
- 🇪🇸 Gaztelania
- 🇫🇷 Frantsesa
- 🇬🇧 Ingelesa

---

## 8. Segurtasuna

- HTTPS zertifikatu guztietan
- Pasahitzak bcrypt hasheatuta
- Saioen kudeaketa segurua
- Multi-tenant: elkarte bakoitza bere datuekin

---

## 9. Hasiera Azkarra

### 9.1 Lehen aldiz konfiguratzeko:

1. Elkartea erregistratu
2. Lehen txosna sortu
3. Kategoriak eta produktuak gehitu
4. Boluntarioak gonbidatu
5. Ordainketa metodoa konfiguratu (nahi bada)
6. TicketBAI gaitu Ezarpenak → BEZ fitxan (Arabako, Bizkaiko edo Gipuzkoako elkarteentzat)
7. Txosna ireki!

### 9.2 Eguneko erabilera:

1. Boluntarioak saioa hasten du
2. Txosna ireki
3. Bezeroak eskaerak egiten ditu
4. Sukaldea prestatzen du
5. Mostradorea entregatzen du
6. Gaua amaitzean txostena jaitsi

---

## 10. Laguntza eta Kontaktua

Galderarik baduzu edo laguntza behar baduzu:

- Dokumentazioa: `/docs` karpetan
- Prototipoa probatu: `/prototype`
- Garatzailearekin kontaktatu

---

_Dokumentazio hau Txosna sistemaren 0.2.0 bertsioari dagokio (Redsys / Bizum online ordainketa gehitua)._
_Azken eguneratzea: 2026ko apirila_
