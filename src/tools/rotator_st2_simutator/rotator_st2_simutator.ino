//
// Fox Delta ST-2向け ローテータ シミュレータ
//

// ST2のコンフィグを行う場合はtrueにする
// memo: config() 参照
const bool CONFIG = false;

// ピン
const int PIN_AZ_ADC = DAC0;
const int PIN_EL_ADC = DAC1;
const int PIN_AZ_LEFT = A2;
const int PIN_AZ_RIGHT = A3;
const int PIN_EL_UP = A4;
const int PIN_EL_DOWN = A5;

const long SERIAL_BORATE = 115200;

int az_deg = 0;
int el_deg = 0;

void setup()
{
  pinMode(PIN_AZ_ADC, OUTPUT);
  pinMode(PIN_EL_ADC, OUTPUT);

  pinMode(PIN_AZ_LEFT, INPUT);
  pinMode(PIN_AZ_RIGHT, INPUT);
  pinMode(PIN_EL_UP, INPUT);
  pinMode(PIN_EL_DOWN, INPUT);

  Serial.begin(SERIAL_BORATE);
}

void loop()
{
  if (CONFIG) {
    config();
  }
  else {
    stub();
  }
}

/**
 * スタブ
 */
void stub()
{
  // ボタン読み取り
  int left_val = analogRead(PIN_AZ_LEFT);
  int right_val = analogRead(PIN_AZ_RIGHT);
  int up_val = analogRead(PIN_EL_UP);
  int down_val = analogRead(PIN_EL_DOWN);

  // AZ、ELの指示値に変換
  int left_on = 0;
  int right_on = 0;
  int up_on = 0;
  int down_on = 0;

  // ボタンが押されていない場合は、すべてが80以上になる
  if (left_val > 80 && right_val > 80 && up_val > 80 && down_val > 80) {
    // 何もしない
  }
  // ボタンが押されている場合
  else {
    if (left_val > 100) {
      az_deg -= 1;
      left_on = 1;
    }
    if (right_val > 100) {
      az_deg += 1;
      right_on = 1;
    }
    if (up_val > 100) {
      el_deg += 1;
      up_on = 1;
    }
    if (down_val > 100) {
      el_deg -= 1;
      down_on = 1;
    }
  }

  // AZ：アナログ出力の0-255の値に変換
  int az_ana_val = map(az_deg, 0, 450, 0, 255);
  // 一応のガード
  if (az_ana_val < 0) az_ana_val = 0;
  if (az_ana_val > 255) az_ana_val = 255;

  // EL：アナログ出力の0-255の値に変換
  int el_ana_val = map(el_deg, 0, 180, 0, 255);
  // 一応のガード
  if (el_ana_val < 0) el_ana_val = 0;
  if (el_ana_val > 255) el_ana_val = 255;

  // AZ、ELを出力
  analogWrite(PIN_AZ_ADC, az_ana_val);
  analogWrite(PIN_EL_ADC, el_ana_val);

  // debug
  Serial.print("L:");
  Serial.print(left_on);
  Serial.print(" R:");
  Serial.print(right_on);
  Serial.print(" U:");
  Serial.print(up_on);
  Serial.print(" D:");
  Serial.print(down_on);
  Serial.print(" AZ:");
  Serial.print(az_deg);
  Serial.print("(");
  Serial.print(az_ana_val);
  Serial.print(")");
  Serial.print(" EL:");
  Serial.print(el_deg);
  Serial.print("(");
  Serial.print(el_ana_val);
  Serial.print(")");
  Serial.print("\n");

  delay(100);
}

/**
 * コンフィグを行う場合
 */
void config()
{
  uint8_t req_data = 0;
  if (Serial.available() > 0) {
    // 最新の1バイトを取得する（古いのは読み捨て）
    while (Serial.available() > 0) {
      req_data = Serial.read();
    }
    Serial.println(req_data);

    // "0" ELを最大にする
    if (req_data == 48) {
      Serial.print("el max");
      Serial.print("\n");
      analogWrite(PIN_EL_ADC, 255);
    }

    // "1" ELを最小にする
    if (req_data == 49) {
      Serial.print("el min");
      Serial.print("\n");
      analogWrite(PIN_EL_ADC, 0);
    }

    // "3" AZを最大にする
    if (req_data == 50) {
      Serial.print("az max");
      Serial.print("\n");
      analogWrite(PIN_AZ_ADC, 255);
    }

    // "4" AZを最小にする
    if (req_data == 51) {
      Serial.print("az min");
      Serial.print("\n");
      analogWrite(PIN_AZ_ADC, 0);
    }
  }
}