#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

residents=(
"maria.carolina|M472"
"bernardo|B819"
"jayame|J536"
"cintia|C294"
"christiane|C715"
"paulino|P648"
"maria.eduarda|M381"
"ariel|A925"
"tamiris|T167"
"maria.clara|M543"
"levi|L829"
"giuliana|G472"
"vinicius|V316"
"edvaldo|E954"
"antonio|A287"
"Joao.gustavo|J402"
"taiara.lohana|T453"
"Isadora.simonassi|I921"
)

preceptors=(
"ana.beatriz|A59151"
"bianca.oliveira|B29592"
"cindy.herrera|C31111"
"djario.costa|D97009"
"felicia.machado|F93742"
"ian.publio|I60257"
"igor.torres|I67837"
"julia.melo|J19897"
"kesia.martins|K60354"
"ludmila.viana|L84363"
"thais.bomfim|T41787"
"vanessa.wallau|V54307"
"marion.wiedemann|M58321"
)

ok=0
fail=0

check_login() {
  local login="$1"
  local password="$2"
  local role="$3"
  local jar
  local headers
  local status
  local location
  local get_code
  local expected_login_location
  local expected_get_path

  jar="$(mktemp)"
  headers="$(mktemp)"

  status="$(curl -sS -o /dev/null -D "$headers" -c "$jar" -b "$jar" \
    -X POST "$BASE_URL/escala/api/login-web" \
    --data-urlencode "email=$login" \
    --data-urlencode "password=$password" \
    -w '%{http_code}')"

  location="$(awk 'BEGIN{IGNORECASE=1} /^Location:/{print $2}' "$headers" | tr -d '\r' | tail -n1)"

  if [[ "$role" == "RESIDENT" ]]; then
    expected_login_location="/escala/resident/shifts"
    expected_get_path="/escala/resident/shifts"
  else
    expected_login_location="/escala"
    expected_get_path="/escala"
  fi

  get_code="$(curl -sS -o /dev/null -c "$jar" -b "$jar" -w '%{http_code}' "$BASE_URL$expected_get_path")"

  if [[ "$status" == "303" && "$location" == "$expected_login_location" && "$get_code" == "200" ]]; then
    echo "OK|$role|$login"
    ok=$((ok + 1))
  else
    echo "FAIL|$role|$login|loginStatus=$status|location=$location|getCode=$get_code"
    fail=$((fail + 1))
  fi

  rm -f "$jar" "$headers"
}

for item in "${residents[@]}"; do
  IFS='|' read -r login password <<< "$item"
  check_login "$login" "$password" "RESIDENT"
done

for item in "${preceptors[@]}"; do
  IFS='|' read -r login password <<< "$item"
  check_login "$login" "$password" "PRECEPTOR"
done

echo "SUMMARY|OK=$ok|FAIL=$fail|TOTAL=$((ok + fail))"
