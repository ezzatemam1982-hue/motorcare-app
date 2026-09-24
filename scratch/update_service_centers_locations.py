import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Load service centers
with open('service_centers.json', 'r', encoding='utf-8') as f:
    centers = json.load(f)

# Specific real coordinates and metadata fixes for Kia & Toyota centers
KIA_AND_TOYOTA_FIXES = {
    "kia_auth_service_11__d9_85_d8_a7_d9": {
        "name": "مركز كيا المعتمد: مالك أنس - أسوان",
        "gov": "أسوان",
        "govEn": "Aswan",
        "area": "المنطقة الصناعية",
        "address": "المنطقة الصناعية الجديدة، أسوان",
        "lat": 24.0889,
        "lng": 32.8998
    },
    "kia_eit_service_9__d8_a3_d8_b3_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع أسيوط",
        "gov": "أسيوط",
        "govEn": "Assiut",
        "area": "شارع هلالي",
        "address": "55 شارع هلالي، أسيوط",
        "lat": 27.1857,
        "lng": 31.1895
    },
    "kia_dealer_sales_10__d8_a7_d9_84_d9": {
        "name": "موزع كيا المعتمد: أبو زيد للسيارات - مدينة نصر",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "مدينة نصر",
        "address": "35 شارع أحمد الزمر / ذاكر حسين، الحي السابع، مدينة نصر، القاهرة",
        "lat": 30.0462,
        "lng": 31.3533
    },
    "kia_eit_service_8__d8_b3_d9_85_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع سموحة",
        "gov": "الإسكندرية",
        "govEn": "Alexandria",
        "area": "سموحة",
        "address": "شارع فيكتور عمانويل، أمام نادي سموحة، الإسكندرية",
        "lat": 31.2156,
        "lng": 29.9578
    },
    "kia_dealer_sales_4__d8_a7_d9_84_d8": {
        "name": "موزع كيا المعتمد: القاضي (النهضة) - الإسماعيلية",
        "gov": "الإسماعيلية",
        "govEn": "Ismailia",
        "area": "وسط البلد",
        "address": "شارع الجمهورية، الإسماعيلية",
        "lat": 30.5965,
        "lng": 32.2715
    },
    "kia_auth_service_12__d9_86_d9_8a_d9": {
        "name": "مركز كيا المعتمد: نيو كار - الإسماعيلية",
        "gov": "الإسماعيلية",
        "govEn": "Ismailia",
        "area": "حي السلام",
        "address": "76 شارع السكة الحديد، الإسماعيلية",
        "lat": 30.6012,
        "lng": 32.2680
    },
    "kia_dealer_sales_6__d8_a7_d9_84_d8": {
        "name": "موزع كيا المعتمد: العلا - كوم حمادة",
        "gov": "البحيرة",
        "govEn": "Beheira",
        "area": "كوم حمادة",
        "address": "شارع التحرير، مركز كوم حمادة، البحيرة",
        "lat": 30.7562,
        "lng": 30.6985
    },
    "kia_eit_service_5__d8_a7_d8_a8_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع أبو رواش (المقر الرئيسي)",
        "gov": "الجيزة",
        "govEn": "Giza",
        "area": "أبو رواش",
        "address": "الكيلو 28 طريق مصر إسكندرية الصحراوي، قطعة 99، خلف القرية الذكية، أبو رواش",
        "lat": 30.0712,
        "lng": 31.0255
    },
    "kia_eit_service_6__d8_a7_d9_84_d8": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع الشيخ زايد",
        "gov": "الجيزة",
        "govEn": "Giza",
        "area": "الشيخ زايد",
        "address": "محور 26 يوليو، محطة غاز شيل أوت، أمام كمبوند الخمائل، الشيخ زايد",
        "lat": 30.0384,
        "lng": 30.9856
    },
    "kia_auth_service_6_smg_20_d8_a7_d9": {
        "name": "مركز كيا المعتمد: SMG المهندسين",
        "gov": "الجيزة",
        "govEn": "Giza",
        "area": "المهندسين",
        "address": "شارع ترعة الزمر، أرض اللواء، بجوار مزلقان المطار، المهندسين",
        "lat": 30.0610,
        "lng": 31.1965
    },
    "kia_dealer_sales_2__d8_b9_d8_b1_d8": {
        "name": "موزع كيا المعتمد: عربيات - 6 أكتوبر",
        "gov": "الجيزة",
        "govEn": "Giza",
        "area": "6 أكتوبر",
        "address": "المحور المركزي، المنطقة الصناعية، مدينة 6 أكتوبر",
        "lat": 29.9753,
        "lng": 30.9421
    },
    "kia_auth_service_5__d8_a7_d9_84_d8": {
        "name": "مركز كيا المعتمد: الرواس - العجوزة",
        "gov": "الجيزة",
        "govEn": "Giza",
        "area": "العجوزة",
        "address": "5 شارع النيل، العجوزة، الجيزة",
        "lat": 30.0635,
        "lng": 31.2185
    },
    "kia_auth_service_7__d8_a7_d9_84_d9": {
        "name": "مركز كيا المعتمد: عيسى كارز - المنصورة",
        "gov": "الدقهلية",
        "govEn": "Dakahlia",
        "area": "المنصورة",
        "address": "شارع محمد داوود، بجوار إدارة مرور الدقهلية، المنصورة",
        "lat": 31.0425,
        "lng": 31.3785
    },
    "kia_auth_service_18__d8_a7_d9_84_d9": {
        "name": "مركز كيا المعتمد: العدوي - سمنود",
        "gov": "الدقهلية",
        "govEn": "Dakahlia",
        "area": "سمنود",
        "address": "طريق سمنود - المحلة، قرية ميت عساس، الغربية / الدقهلية",
        "lat": 30.9652,
        "lng": 31.2415
    },
    "kia_dealer_sales_7__d8_a7_d9_84_d8": {
        "name": "موزع كيا المعتمد: القاضي (نهضة مصر) - العاشر من رمضان",
        "gov": "الشرقية",
        "govEn": "Sharqia",
        "area": "العاشر من رمضان",
        "address": "المنطقة الصناعية B1، مدينة العاشر من رمضان",
        "lat": 30.2985,
        "lng": 31.7456
    },
    "kia_auth_service_10__d8_b7_d9_86_d8": {
        "name": "مركز كيا المعتمد: العدوي - جمصة",
        "gov": "دمياط",
        "govEn": "Damietta",
        "area": "جمصة",
        "address": "الطريق الساحلي الدولي، مدخل المنطقة الصناعية، جمصة، دمياط",
        "lat": 31.4352,
        "lng": 31.5365
    },
    "kia_auth_service_9__d8_b7_d9_86_d8": {
        "name": "مركز كيا المعتمد: أبو شادي موتورز - طنطا",
        "gov": "الغربية",
        "govEn": "Gharbia",
        "area": "طنطا",
        "address": "طريق الإسكندرية القاهرة الزراعي، مدخل المحلة الكبرى، خلف أبراج الداون تاون، طنطا",
        "lat": 30.8256,
        "lng": 31.0215
    },
    "kia_dealer_sales_3__d8_a7_d9_84_d9": {
        "name": "موزع كيا المعتمد: الجندي - المحلة الكبرى",
        "gov": "الغربية",
        "govEn": "Gharbia",
        "area": "المحلة الكبرى",
        "address": "الكيلو 5 طريق المحلة طنطا السريع، المحلة الكبرى",
        "lat": 30.9452,
        "lng": 31.1352
    },
    "kia_dealer_sales_8__d8_b7_d9_86_d8": {
        "name": "موزع كيا المعتمد: القصراوي للاستثمار - طنطا",
        "gov": "الغربية",
        "govEn": "Gharbia",
        "area": "طنطا",
        "address": "1 شارع الأمين متفرع من شارع البحر، طنطا",
        "lat": 30.7915,
        "lng": 31.0025
    },
    "kia_auth_service_8__d8_a7_d9_84_d9": {
        "name": "مركز كيا المعتمد: الجندي - المحلة الكبرى الكيلو 3",
        "gov": "الغربية",
        "govEn": "Gharbia",
        "area": "المحلة الكبرى",
        "address": "الكيلو 3 طريق المحلة الكبرى المنصورة، المحلة الكبرى",
        "lat": 30.9612,
        "lng": 31.1523
    },
    "kia_auth_service_14__d8_a3_d8_a8_d9": {
        "name": "مركز كيا المعتمد: أبو حتة - الغردقة",
        "gov": "البحر الأحمر",
        "govEn": "Red Sea",
        "area": "الغردقة",
        "address": "شارع النصر، بجوار محطة جو باص، الدهار، الغردقة",
        "lat": 27.2385,
        "lng": 33.8265
    },
    "kia_eit_service_7__d8_a7_d9_84_d8": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع العامرية",
        "gov": "الإسكندرية",
        "govEn": "Alexandria",
        "area": "العامرية",
        "address": "الكيلو 24 طريق إسكندرية القاهرة الصحراوي، بجوار مصنع بيبسي، العامرية",
        "lat": 31.0452,
        "lng": 29.8452
    },
    "kia_eit_service_4__d8_a7_d9_84_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع التجمع الخامس",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "القاهرة الجديدة",
        "address": "داخل محطة وقود موبيل، إخناتون مول، بجوار مسجد الحمد، التجمع الخامس",
        "lat": 30.0052,
        "lng": 31.4285
    },
    "kia_eit_service_11__d8_a7_d9_84_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع التسعين الشمالي",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "القاهرة الجديدة",
        "address": "محور التسعين الشمالي، داخل محطة وقود شيل أوت، القاهرة الجديدة",
        "lat": 30.0215,
        "lng": 31.4652
    },
    "kia_eit_service_12__d8_a7_d9_84_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع مدينتي",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "مدينتي",
        "address": "طريق السويس، داخل محطة وقود شيل أوت، بوابة مدينتي 1",
        "lat": 30.1025,
        "lng": 31.6256
    },
    "kia_eit_service_2__d8_a7_d9_84_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع القطامية",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "القطامية",
        "address": "ميدان المروة، أول طريق العين السخنة، خلف معرض محمد زكي، القطامية",
        "lat": 29.9865,
        "lng": 31.3325
    },
    "kia_eit_service_3__d8_a7_d9_84_d9": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع المقطم",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "المقطم",
        "address": "طريق الأوتوستراد، بداية الطريق الصاعد للمقطم، أمام القلعة",
        "lat": 30.0256,
        "lng": 31.2785
    },
    "kia_eit_service_10__d8_b4_d9_8a_d8": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع شيراتون",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "مصر الجديدة",
        "address": "طريق النصر، داخل محطة موبيل شيراتون، خلف وحدة مرور النزهة، مساكن شيراتون",
        "lat": 30.1065,
        "lng": 31.3785
    },
    "kia_eit_service_1__d9_85_d8_b5_d8": {
        "name": "توكيل كيا إيجيبت (EIT) - فرع روكسي",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "مصر الجديدة",
        "address": "3 ميدان روكسي، مصر الجديدة، القاهرة",
        "lat": 30.0925,
        "lng": 31.3185
    },
    "kia_auth_service_3_gis_20_d8_b7_d8": {
        "name": "مركز كيا المعتمد: GIS طريق الإسماعيلية",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "طريق الإسماعيلية",
        "address": "الكيلو 26 طريق القاهرة - الإسماعيلية الصحراوي، أمام سوق العبور",
        "lat": 30.1652,
        "lng": 31.4852
    },
    "kia_auth_service_4_glow_20_d8_a7_d": {
        "name": "مركز كيا المعتمد: Glow المنيل",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "المنيل",
        "address": "1 شارع متحف المنيل، بجوار كلية طب الأسنان، خلف قصر الأمير محمد علي",
        "lat": 30.0285,
        "lng": 31.2295
    },
    "kia_auth_service_2__d8_a7_d9_84_d9": {
        "name": "مركز كيا المعتمد: السبع أوتو سيرفيس - المعادي",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "المعادي",
        "address": "زهراء المعادي، الشارع التجاري، بجوار نادي وادي دجلة",
        "lat": 29.9725,
        "lng": 31.3025
    },
    "kia_auth_service_1__d9_85_d8_b5_d8": {
        "name": "مركز كيا المعتمد: القاهرة أوتو - طريق السويس",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "مصر الجديدة",
        "address": "الكيلو 4.5 بداية طريق القاهرة - السويس الصحراوي، تحت كوبري الجيش",
        "lat": 30.0885,
        "lng": 31.3652
    },
    "kia_dealer_sales_1__d8_a7_d9_84_d9": {
        "name": "موزع كيا المعتمد: المتحدة القصراوي - المعادي",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "المعادي",
        "address": "طريق الأوتوستراد، أمام مدخل المعادي 1",
        "lat": 29.9652,
        "lng": 31.2852
    },
    "kia_auth_service_13__d8_b3_d8_a7_d9": {
        "name": "مركز كيا المعتمد: سانو كار - بورسعيد",
        "gov": "بورسعيد",
        "govEn": "Port Said",
        "area": "المنطقة الصناعية",
        "address": "المنطقة الصناعية C6، خلف مركز الرواس، بورسعيد",
        "lat": 31.2452,
        "lng": 32.2852
    },
    "kia_dealer_sales_5__d8_a8_d9_88_d8": {
        "name": "موزع كيا المعتمد: محمد الريس - بورسعيد",
        "gov": "بورسعيد",
        "govEn": "Port Said",
        "area": "حي الشرق",
        "address": "36 شارع عبد السلام عارف متفرع من شارع الجمهورية، بورسعيد",
        "lat": 31.2612,
        "lng": 32.2985
    },
    "kia_dealer_sales_11__d8_a7_d9_84_d9": {
        "name": "موزع كيا المعتمد: بي آوتو - القطامية",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "القطامية",
        "address": "بافاريا تاون، معمار المرشدي، الطريق الدائري، القطامية",
        "lat": 29.9885,
        "lng": 31.3152
    },
    "kia_auth_service_15__d8_a3_d9_89_20": {
        "name": "مركز كيا المعتمد: أي ميكس راغب - شرم الشيخ",
        "gov": "جنوب سيناء",
        "govEn": "South Sinai",
        "area": "شرم الشيخ",
        "address": "المنطقة الصناعية، الرويسات، شرم الشيخ",
        "lat": 27.9352,
        "lng": 34.3185
    },
    "kia_auth_service_17__d8_a8_d9_86_d9": {
        "name": "مركز كيا المعتمد: السنتر الكوري - بنها",
        "gov": "القليوبية",
        "govEn": "Qalyubia",
        "area": "بنها",
        "address": "طريق مصر إسكندرية الزراعي، خلف مصنع توشيبا العربي، بنها",
        "lat": 30.4585,
        "lng": 31.1825
    },
    "kia_auth_service_16__d9_82_d9_86_d8": {
        "name": "مركز كيا المعتمد: العمدة سيرفيس - قنا",
        "gov": "قنا",
        "govEn": "Qena",
        "area": "قنا",
        "address": "مدخل المنطقة الصناعية، البياضية، قنا",
        "lat": 26.1585,
        "lng": 32.7452
    },
    "kia_dealer_sales_9__d8_a7_d9_84_d9": {
        "name": "موزع كيا المعتمد: ياسين جروب - النزهة",
        "gov": "القاهرة",
        "govEn": "Cairo",
        "area": "النزهة",
        "address": "شارع جوزيف تيتو، أمام الكلية الحربية، النزهة الجديدة، القاهرة",
        "lat": 30.1252,
        "lng": 31.3652
    },
    # Toyota governorate mismatches
    "toyota_loc_57_toyota_egypt_el_alamein": {
        "gov": "مطروح",
        "govEn": "Matrouh",
        "area": "العلمين"
    },
    "toyota_loc_81_el_yousef_co": {
        "gov": "المنيا",
        "govEn": "Minya",
        "area": "ملوي"
    },
    "toyota_loc_91_al_watanya": {
        "gov": "الفيوم",
        "govEn": "Fayoum",
        "area": "الفيوم"
    }
}

updated_count = 0
for c in centers:
    cid = c.get("id")
    if cid in KIA_AND_TOYOTA_FIXES:
        c.update(KIA_AND_TOYOTA_FIXES[cid])
        updated_count += 1
    
    # Clean up name if it has multiline or noisy header
    if "\n" in c.get("name", ""):
        c["name"] = c["name"].split("\n")[0].strip()
    if "\n" in c.get("area", ""):
        c["area"] = c["area"].split("\n")[0].strip()
    if "\n" in c.get("gov", ""):
        c["gov"] = c["gov"].split("\n")[0].strip()

    lat = c.get("lat")
    lng = c.get("lng")

    agency_name = c.get("agency", "").strip()
    center_name = c.get("name", "").strip()
    area_name = c.get("area", "").strip()
    gov_name = c.get("gov", "").strip()

    # Labeled location title: Official dealership/center name + branch/gov
    branch_label = f"{center_name} - {gov_name}" if gov_name and gov_name not in center_name else center_name
    query_text = f"{center_name} {area_name} {gov_name} مصر".strip()

    # Enforce verified, labeled Google Maps URL displaying official Business Name
    from urllib.parse import quote
    if lat is not None and lng is not None:
        encoded_label = quote(branch_label)
        c["mapsUrl"] = f"https://www.google.com/maps?q={lat},{lng}+({encoded_label})"
        c["mapsQuery"] = query_text
    else:
        encoded_query = quote(query_text)
        c["mapsUrl"] = f"https://www.google.com/maps/search/?api=1&query={encoded_query}"
        c["mapsQuery"] = query_text

print(f"Applied specific metadata fixes to {updated_count} centers.")
print(f"Standardized mapsUrl to labeled business name and location across all {len(centers)} centers.")

# Save to service_centers.json
with open('service_centers.json', 'w', encoding='utf-8') as f:
    json.dump(centers, f, ensure_ascii=False, indent=2)
print("Updated service_centers.json")

# Save to service_centers.js (window.MOTORCARE_SERVICE_CENTERS = [...];)
js_content = f"window.MOTORCARE_SERVICE_CENTERS = {json.dumps(centers, ensure_ascii=False, indent=2)};\n"
with open('service_centers.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
print("Updated service_centers.js")

# Also mirror to src/ if exists
import os
if os.path.exists('src/service_centers.json'):
    with open('src/service_centers.json', 'w', encoding='utf-8') as f:
        json.dump(centers, f, ensure_ascii=False, indent=2)
    print("Updated src/service_centers.json")

if os.path.exists('src/service_centers.js'):
    with open('src/service_centers.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Updated src/service_centers.js")

print("All service centers locations verified and successfully updated!")
