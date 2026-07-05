#!/bin/bash
#
# REST API (v1) end-to-end teszt.
# Előfeltételek: friss seed (npm run db:seed) + futó szerver.
# Futtatás: bash e2e/api-test.sh
B=http://localhost:3000/api/v1
PASS=0; FAIL=0
chk(){ if [ "$1" = "$2" ]; then PASS=$((PASS+1)); echo "✔ $3"; else FAIL=$((FAIL+1)); echo "✘ $3 (kapott: $1, várt: $2)"; fi }

# --- auth
T=$(curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d '{"email":"anna@example.com","password":"titok123!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
chk $([ -n "$T" ] && echo ok) ok "login: token kapva"
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/auth/login -H 'Content-Type: application/json' -d '{"email":"anna@example.com","password":"rossz"}') 401 "login: rossz jelszó → 401"
chk $(curl -s -o /dev/null -w '%{http_code}' $B/me) 401 "me token nélkül → 401"
ME=$(curl -s $B/me -H "Authorization: Bearer $T")
chk $(echo $ME | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['name']=='Kiss Anna' and d['partner']['name']=='Nagy Bence')") True "me: név + pár"

# --- ideas
IDEAS=$(curl -s "$B/ideas?rendezes=ertekeles")
chk $(echo $IDEAS | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(len(d)>=13)") True "ideas: lista"
IDEA_ID=$(curl -s "$B/ideas?q=naplemente" | python3 -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
DET=$(curl -s $B/ideas/$IDEA_ID -H "Authorization: Bearer $T")
chk $(echo $DET | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['partner']['couponCode']=='VARBAN15')") True "idea detail: kuponkód bejelentkezve"
DET_ANON=$(curl -s $B/ideas/$IDEA_ID)
chk $(echo $DET_ANON | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['partner']['couponCode'] is None)") True "idea detail: kuponkód vendégnek rejtve"
chk $(echo $DET_ANON | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(all(c['privateText'] is None for c in d['publicCompletions']))") True "idea detail: privát szöveg vendégnek rejtve"
chk $(echo $DET | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(any(c['privateText'] for c in d['publicCompletions']))") True "idea detail: saját privát szöveg a párnak látszik"

# --- complete + review
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/ideas/$IDEA_ID/complete -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"date":"2026-07-01","publicText":"API-ból pipálva!","privateText":"psszt","imagePublic":false}') 201 "complete: 201"
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/ideas/$IDEA_ID/review -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"stars":5,"text":"API teszt értékelés"}') 200 "review: upsert 200"
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/ideas/$IDEA_ID/review -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"stars":9}') 400 "review: 9 csillag → 400"

# --- ideas submit
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/ideas -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"title":"API teszt ötlet","description":"Ez egy legalább húsz karakteres leírás az API tesztből.","category":"Otthoni","isLocationIndependent":true}') 201 "idea submit: 201 (PENDING)"

# --- lists
LISTS=$(curl -s $B/lists -H "Authorization: Bearer $T")
chk $(echo $LISTS | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(any(l['isSystem'] for l in d) and any(not l['isSystem'] for l in d))") True "lists: gyári + saját"
NEWLIST=$(curl -s -X POST $B/lists -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"title":"API lista"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/lists/$NEWLIST/items -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d "{\"ideaId\":\"$IDEA_ID\"}") 201 "list item: hozzáadás 201"
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/lists/$NEWLIST/items -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d "{\"ideaId\":\"$IDEA_ID\"}") 409 "list item: duplikátum → 409"
LDET=$(curl -s $B/lists/$NEWLIST -H "Authorization: Bearer $T")
chk $(echo $LDET | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d['items'][0]['completed'])") True "list detail: teljesített jelölés (pár pipája)"
# Kata nem éri el Anna listáját
TK=$(curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d '{"email":"kata@example.com","password":"titok123!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
chk $(curl -s -o /dev/null -w '%{http_code}' $B/lists/$NEWLIST -H "Authorization: Bearer $TK") 404 "list detail: idegené rejtve → 404"

# --- journal
J=$(curl -s $B/journal -H "Authorization: Bearer $T")
chk $(echo $J | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(any(e['privateText']=='psszt' for e in d))") True "journal: friss privát bejegyzés"
JK=$(curl -s $B/journal -H "Authorization: Bearer $TK")
chk $(echo $JK | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(not any(e.get('privateText')=='psszt' for e in d))") True "journal: idegen nem látja"
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/journal -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"title":"API emlék","date":"2026-06-30","text":"appon kívüli"}') 201 "journal: memory 201"

# --- notifications + dates + couple
chk $(curl -s $B/notifications -H "Authorization: Bearer $T" -o /dev/null -w '%{http_code}') 200 "notifications: 200"
chk $(curl -s -X POST $B/notifications -H "Authorization: Bearer $T" -o /dev/null -w '%{http_code}') 200 "notifications: mind olvasott"
D=$(curl -s $B/dates -H "Authorization: Bearer $T")
chk $(echo $D | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(len(d['dates'])>=3 and len(d['upcoming'])>=1)") True "dates: lista + közelgő fordulók"
INV=$(curl -s -X POST $B/couple -H "Authorization: Bearer $TK" -H 'Content-Type: application/json' -d '{"action":"invite"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['inviteCode'])")
chk $([ ${#INV} = 6 ] && echo ok) ok "couple: meghívókód (Kata)"
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/couple -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d '{"action":"invite"}') 409 "couple: Anna már párban → 409"
chk $(curl -s -o /dev/null -w '%{http_code}' -X POST $B/couple -H "Authorization: Bearer $TK" -H 'Content-Type: application/json' -d '{"action":"leave"}') 200 "couple: Kata kilép"

echo; echo "Összesen: $PASS zöld, $FAIL hibás"; [ $FAIL = 0 ]
