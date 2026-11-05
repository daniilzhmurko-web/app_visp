#!/usr/bin/env python3
"""База ИГ: 10 «сценарных» записей (IG-001…010, с ловушками) + синтетика до 600 человек.
Все данные вымышлены. Фиксированный seed => воспроизводимо.  Запуск: python tools/generate_people.py [seed]
Если есть data/fingerprints/index.json (после import_socofing.py) — пол и отпечатки (поле fp) берутся из SOCOFing."""
import json,os,random,sys
from datetime import date,timedelta
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); P=os.path.join(R,'data','persons','foreign_citizens.json')
rnd=random.Random(int(sys.argv[1]) if len(sys.argv)>1 else 20261029); TOTAL=600
S=lambda s:s.split()
NAT={ # вес, фамилии, муж., жен., отчество, префикс паспорта, цифр
'Узбекистан':(40,S('Расулов Каримов Рахимов Юсупов Исмаилов Абдуллаев Назаров Хасанов Саидов Тошматов Холматов Мирзаев Алимов Турсунов'),S('Бахром Акбар Рустам Жасур Улугбек Фарход Азиз Шерзод Достон Сардор Бекзод Дилшод'),S('Мадина Зарина Нигора Дилноза Гулнора Шахноза Малика Феруза Саодат Юлдуз'),1,['AA','AB','FA'],7),
'Таджикистан':(20,S('Рахмонов Шарипов Сафаров Гафуров Ходжаев Назаров Мирзоев Бобоев Давлатов Нуров'),S('Фирдавс Рустам Далер Мухаммад Парвиз Сухроб Фаррух Умар'),S('Мунира Фарзона Нигина Шахло Зарина Гулноза Мохира'),1,['A','TJ'],8),
'Киргизия':(12,S('Исаков Токтогулов Осмонов Сыдыков Эркинов Бекболотов Мамытов Жумабаев'),S('Азамат Нурлан Эмиль Бакыт Улан Данияр Тилек Аман'),S('Айгуль Чолпон Айжан Бермет Гульнара Назира Айнура'),1,['AN','KG'],7),
'Казахстан':(6,S('Ахметов Сарсенов Нургалиев Кенжебаев Тулеуов Мукашев Омаров'),S('Ерлан Талгат Аскар Бауыржан Дастан Марат'),S('Айгерим Динара Аружан Мадина Салтанат'),1,['N'],8),
'Армения':(6,S('Оганесян Саркисян Григорян Манукян Акопян Погосян Арутюнян'),S('Армен Левон Ашот Артур Грант Тигран'),S('Анна Лусине Нарине Гаяне Мариам'),1,['AN','AP'],7),
'Азербайджан':(6,S('Алиев Гасанов Мамедов Гусейнов Исмаилов Керимов Джафаров'),S('Мамед Рашид Эльчин Тофик Фарид Орхан'),S('Лейла Айдан Гюнай Севиль Нигяр'),1,['AZ'],7),
'Молдова':(3,S('Мунтяну Руссу Чобану Постолаке Лунгу Береза'),S('Ион Влад Василе Андрей Николае'),S('Мария Елена Ана Виорика Татьяна'),0,['B'],7),
'Вьетнам':(4,S('Нгуен Чан Ле Фам Хоанг Во Данг'),S('Ван Минь Дык Хунг Тхань Куанг'),S('Тхи Хыонг Лан Май Тху Нга'),0,['B','C'],7),
'Республика Корея':(3,S('Ким Ли Пак Чхве Чон Кан'),S('Мин-Джун Сон-У Дже-Хун Хён-У'),S('Чжи Ын Со-Ён Ха-Юн Мин-Чжи'),0,['M'],8)}
TR=dict(zip(S('а б в г д е ё ж з и й к л м н о п р с т у ф х ц ч ш щ ъ ы ь э ю я'),['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya']))
tr=lambda s:' '.join(''.join(TR.get(ch,ch) for ch in w.lower()).title() for w in s.split())
def fem(s):
    for e in ('ов','ев','ин'):
        if s.endswith(e): return s+'а'
    return s
def patr(n,f): return (n[:-1]+'ев' if n.endswith('й') else n+'ов')+('на' if f else 'ич')
CORE_AMINA={'IG-001':dict(state='active',installed='2025-11-21',at_border=True,last_geo='2025-12-19',gap_wd=0,geo_match=True,work_match=True),
 'IG-002':dict(state='no_geo',installed='2025-10-02',at_border=True,last_geo='2025-12-12',gap_wd=4),
 'IG-004':dict(state='active',installed='2025-09-15',at_border=True,last_geo='2025-12-19',gap_wd=0,geo_match=True,work_match=True),
 'IG-006':dict(state='active',installed='2025-10-11',at_border=True,last_geo='2025-12-18',gap_wd=0,geo_match=True,work_match=False),
 'IG-007':dict(state='not_installed',at_border=False),
 'IG-008':dict(state='active',installed='2025-11-02',at_border=True,last_geo='2025-12-19',gap_wd=0,geo_match=True,work_match=True),
 'IG-010':dict(state='no_geo',installed='2025-08-20',at_border=False,last_geo='2025-12-05',gap_wd=8)}
AMINA_C=['Узбекистан','Таджикистан','Киргизия','Армения','Казахстан','Азербайджан','Молдова']   # страны эксперимента (без Грузии/Украины в синтетике)
old=json.load(open(P,encoding='utf-8')); core=[x for x in old if x['id']<='IG-010']
for x in core: x.pop('photo',None); x.pop('fp',None); x.pop('amina',None); x.update({'amina':CORE_AMINA[x['id']]} if x['id'] in CORE_AMINA else {})
fx=os.path.join(R,'data','fingerprints','index.json'); fp=json.load(open(fx,encoding='utf-8')) if os.path.exists(fx) else []
subs=sorted(f['id'] for f in fp) or [f'FP-{i:03d}' for i in range(1,TOTAL+1)]; sexof={f['id']:('Ж' if f['sex']=='F' else 'М') for f in fp if f.get('sex')}
free=list(subs); take=lambda sex:next((s for s in free if sexof.get(s,sex)==sex),free[0])
byid={}
for x in core:
    if x['id']=='IG-006': continue
    s=take(x['sex']); free.remove(s); x['fp']=s; byid[x['id']]=x
byid.get('IG-004') and core[5].update(fp=byid['IG-004']['fp'])        # IG-006 — «двойник» IG-004 по отпечаткам
used={x['passport'] for x in core}; out=list(core); nats=list(NAT); W=[NAT[n][0] for n in nats]
TRAPS=['wanted']*9+['expired_passport']*12+['fake_check']*12+['biometric_dup']*9+['fsb_ban']*9+['rubber_apt']*9
rnd.shuffle(TRAPS); TRAPS+= [None]*(TOTAL-len(core)-len(TRAPS)); rnd.shuffle(TRAPS)
for k,s in enumerate(free[:TOTAL-len(core)]):
    n=rnd.choices(nats,W)[0]; _,sn,mn,fn,pt,pre,dg=NAT[n]; sex=sexof.get(s) or rnd.choice('МЖ'); f=sex=='Ж'
    sur=rnd.choice(sn); giv=rnd.choice(fn if f else mn); sur=fem(sur) if f else sur
    name=f'{sur} {giv}'+(' '+patr(rnd.choice(mn),f) if pt else '') if n not in('Вьетнам','Республика Корея') else (f'{sur} {giv}')
    while True:
        pn=rnd.choice(pre)+''.join(rnd.choice('0123456789') for _ in range(dg))
        if pn not in used: used.add(pn); break
    trap=TRAPS[k]; entry=date(2025,5,1)+timedelta(days=rnd.randint(0,228)); purpose=rnd.choices(['Работа','Учёба','Частная','Туризм','Лечение'],[70,8,12,7,3])[0]
    exp=date(2026,1,10)+timedelta(days=rnd.randint(0,60)) if trap=='expired_passport' else date(2027,1,1)+timedelta(days=rnd.randint(0,2400))
    p=dict(id=f'IG-{11+k:03d}',name=name,nameEn=tr(name.split()[0]+' '+name.split()[1]) if n not in('Вьетнам','Республика Корея') else tr(name),nationality=n,
      dob=(date(1960,1,1)+timedelta(days=rnd.randint(0,16500))).strftime('%d.%m.%Y'),sex=sex,passport=pn,passportExp=str(exp),mcard='22'+''.join(rnd.choice('0123456789') for _ in range(8)),
      entryDate=str(entry),entryPurpose=purpose,inn='77'+''.join(rnd.choice('0123456789') for _ in range(10)),trap=trap,fp=s)
    if n in AMINA_C:
        if purpose=='Работа':
            st=rnd.choices(['ok','no_geo3','no_geo7','nin','geo','work'],[82,4,2,5,4,3])[0]; inst=entry+timedelta(days=rnd.randint(0,12))
            a=dict(state='active',installed=str(inst),at_border=rnd.random()<.9,last_geo='2025-12-19',gap_wd=0,geo_match=True,work_match=True)
            if st=='no_geo3': a.update(state='no_geo',gap_wd=rnd.randint(3,5),last_geo='2025-12-12')
            if st=='no_geo7': a.update(state='no_geo',gap_wd=rnd.randint(6,10),last_geo='2025-12-05')
            if st=='nin': a=dict(state=rnd.choice(['not_installed','removed']),at_border=False)
            if st=='geo': a['geo_match']=False
            if st=='work': a['work_match']=False
            p['amina']=a
    out.append(p)
dupe=[x for x in out if x.get('trap')=='biometric_dup' and x['id']>'IG-010']
for x in dupe: x['fp']=rnd.choice([y for y in out if y is not x and y.get('trap')!='biometric_dup'])['fp']   # отпечатки совпадают с чужой записью
json.dump(out,open(P,'w',encoding='utf-8'),ensure_ascii=False,indent=1); open(P,'a').write('\n'); print('людей:',len(out),'| ловушек:',sum(1 for x in out if x.get('trap')),'| с «Аминой»:',sum('amina' in x for x in out))
