// Nova Wing translation catalog: UI, campaign, gameplay, hangar and accessible text.
// Original PT-BR strings remain the canonical source; IDs, names and saves never change.
const ROWS = [
  ['CANHÃO · PRÓXIMA CLASSE', 'CANNON · NEXT CLASS', 'CAÑÓN · SIGUIENTE CLASE'],
  ['MULTITIRO · +1 PROJÉTIL', 'MULTISHOT · +1 PROJECTILE', 'MULTIDISPARO · +1 PROYECTIL'],
  [
    'CANHÃO DE DISPERSÃO · CURTO ALCANCE',
    'SCATTER CANNON · CLOSE RANGE',
    'CAÑÓN DE DISPERSIÓN · CORTO ALCANCE',
  ],
  ['CANHÃO DE DISPERSÃO', 'SCATTER CANNON', 'CAÑÓN DE DISPERSIÓN'],
  [
    'DISPARO EQUIPADO: PULSO · ALCANCE LONGO',
    'EQUIPPED: PULSE · LONG RANGE',
    'EQUIPADO: PULSO · LARGO ALCANCE',
  ],
  [
    'DISPARO EQUIPADO: DISPERSÃO · CURTO ALCANCE',
    'EQUIPPED: SCATTER · CLOSE RANGE',
    'EQUIPADO: DISPERSIÓN · CORTO ALCANCE',
  ],
  ['EQUIPAR DISPERSÃO', 'EQUIP SCATTER', 'EQUIPAR DISPERSIÓN'],
  ['EQUIPAR PULSO', 'EQUIP PULSE', 'EQUIPAR PULSO'],
  ['NÚCLEO RÁPIDO · CADÊNCIA +', 'RAPID CORE · FIRE RATE +', 'NÚCLEO RÁPIDO · CADENCIA +'],
  ['PACOTE BOMBAS ×3', 'BOMB PACK ×3', 'PAQUETE BOMBAS ×3'],
  ['PRECISA DE 3 VAGAS', 'NEEDS 3 FREE SLOTS', 'NECESITA 3 ESPACIOS LIBRES'],
  ['BOMBAS', 'BOMBS', 'BOMBAS'],
  ['MULTITIRO', 'MULTISHOT', 'MULTIDISPARO'],
  ['NÚCLEO RÁPIDO', 'RAPID CORE', 'NÚCLEO RÁPIDO'],
  [
    'VER MAPA E PREPARAR A PRÓXIMA MISSÃO ↗',
    'VIEW MAP AND PREPARE NEXT MISSION ↗',
    'VER MAPA Y PREPARAR LA SIGUIENTE MISIÓN ↗',
  ],
  ['Mapa de progresso da campanha', 'Campaign progress map', 'Mapa de progreso de campaña'],
  [
    'FIVE CATS / ROTA DE PERSEGUIÇÃO',
    'FIVE CATS / PURSUIT ROUTE',
    'FIVE CATS / RUTA DE PERSECUCIÓN',
  ],
  ['MAPA DA GALÁXIA', 'GALAXY MAP', 'MAPA DE LA GALAXIA'],
  ['Progresso dos dez setores', 'Progress through ten sectors', 'Progreso de los diez sectores'],
  [
    'INTELIGÊNCIA DA PRÓXIMA MISSÃO',
    'NEXT MISSION INTELLIGENCE',
    'INFORMACIÓN DE LA SIGUIENTE MISIÓN',
  ],
  ['VOLTAR AO HANGAR', 'BACK TO HANGAR', 'VOLVER AL HANGAR'],
  ['INICIAR PRÓXIMA FASE ↗', 'LAUNCH NEXT STAGE ↗', 'INICIAR SIGUIENTE FASE ↗'],
  ['CONCLUÍDO', 'COMPLETED', 'COMPLETADO'],
  ['PRÓXIMA MISSÃO', 'NEXT MISSION', 'SIGUIENTE MISIÓN'],
  ['ROTA A SEGUIR', 'ROUTE AHEAD', 'RUTA POR SEGUIR'],
  ['AMEAÇAS:', 'THREATS:', 'AMENAZAS:'],
  ['ALVO PRIORITÁRIO:', 'PRIORITY TARGET:', 'OBJETIVO PRIORITARIO:'],
  ['SETORES CONCLUÍDOS', 'SECTORS COMPLETED', 'SECTORES COMPLETADOS'],
  ['Setor', 'Sector', 'Sector'],
  [
    'Torres, sentinelas e caças de interceptação',
    'Towers, sentries and interceptor fighters',
    'Torres, centinelas y cazas de intercepción',
  ],
  [
    'Defesas costeiras e máquinas submarinas',
    'Coastal defenses and underwater machines',
    'Defensas costeras y máquinas submarinas',
  ],
  [
    'Detritos em alta velocidade e perfuradores',
    'High-speed debris and drillers',
    'Escombros a alta velocidad y perforadores',
  ],
  [
    'Geradores externos e baterias orbitais',
    'External generators and orbital batteries',
    'Generadores externos y baterías orbitales',
  ],
  [
    'Rajadas de plasma e instabilidade térmica',
    'Plasma bursts and thermal instability',
    'Ráfagas de plasma e inestabilidad térmica',
  ],
  [
    'Blindados e disparos congelantes',
    'Armored units and freezing shots',
    'Blindados y disparos congelantes',
  ],
  [
    'Organismos hostis e ataques em múltiplas direções',
    'Hostile organisms and multidirectional attacks',
    'Organismos hostiles y ataques en múltiples direcciones',
  ],
  [
    'Formações pesadas e barragens de mísseis',
    'Heavy formations and missile barrages',
    'Formaciones pesadas y andanadas de misiles',
  ],
  [
    'Gravidade anômala e escuridão espacial',
    'Anomalous gravity and space darkness',
    'Gravedad anómala y oscuridad espacial',
  ],
  [
    'Fortaleza final e a frota de Marvin',
    "Final fortress and Marvin's fleet",
    'Fortaleza final y la flota de Marvin',
  ],
  ['Ameaças desconhecidas', 'Unknown threats', 'Amenazas desconocidas'],
  [
    'WASD / SETAS · ESPAÇO / TIRO · DOURADO = CRÉDITOS',
    'WASD / ARROWS · SPACE / FIRE · GOLD = CREDITS',
    'WASD / FLECHAS · ESPACIO / DISPARO · DORADO = CRÉDITOS',
  ],
  ['NOVA-7 / SISTEMAS DE VOO', 'NOVA-7 / FLIGHT SYSTEMS', 'NOVA-7 / SISTEMAS DE VUELO'],
  ['⚙ NAVE', '⚙ SHIP', '⚙ NAVE'],
  ['F · PULSO', 'F · PULSE', 'F · PULSO'],
  ['H · BARREIRA', 'H · BARRIER', 'H · BARRERA'],
  ['G · ATIVAR', 'G · ACTIVATE', 'G · ACTIVAR'],
  ['K · PRECISÃO ◆', 'K · PRECISION ◆', 'K · PRECISIÓN ◆'],
  ['R · REPARO ◆◆', 'R · REPAIR ◆◆', 'R · REPARAR ◆◆'],
  ['U · RAJADA ◆◆◆', 'U · BARRAGE ◆◆◆', 'U · RÁFAGA ◆◆◆'],
  ['ORBITAR', 'ORBIT', 'ORBITAR'],
  ['C · PERSEGUIÇÃO', 'C · CHASE', 'C · PERSECUCIÓN'],
  ['INTEGRIDADE DO ESCUDO', 'SHIELD INTEGRITY', 'INTEGRIDAD DEL ESCUDO'],
  ['● SISTEMAS ONLINE', '● SYSTEMS ONLINE', '● SISTEMAS ACTIVOS'],
  ['BLOCO I / SETOR 01', 'BLOCK I / SECTOR 01', 'BLOQUE I / SECTOR 01'],
  ['ACERTOS', 'HITS', 'ACIERTOS'],
  ['SOM ON', 'SOUND ON', 'SONIDO ON'],
  ['SOM OFF', 'SOUND OFF', 'SONIDO OFF'],
  ['SUBCHEFE', 'MINIBOSS', 'SUBJEFE'],
  ['CRUZADOR DE INTERCEPTAÇÃO', 'INTERCEPTOR CRUISER', 'CRUCERO INTERCEPTOR'],
  [
    'SEGURE E SOLTE O TIRO PARA LANÇAR PLASMA',
    'HOLD AND RELEASE FIRE TO LAUNCH PLASMA',
    'MANTÉN Y SUELTA DISPARO PARA LANZAR PLASMA',
  ],
  ['/ CANAL FIVE CATS', '/ FIVE CATS CHANNEL', '/ CANAL FIVE CATS'],
  ['BOMBAS DE PLASMA', 'PLASMA BOMBS', 'BOMBAS DE PLASMA'],
  ['B / X PARA LANÇAR', 'B / X TO LAUNCH', 'B / X PARA LANZAR'],
  ['VELOCIDADE', 'SPEED', 'VELOCIDAD'],
  ['IMPULSO', 'BOOST', 'IMPULSO'],
  ['Q / E / Z · GIRO DEFENSIVO', 'Q / E / Z · DEFENSIVE ROLL', 'Q / E / Z · GIRO DEFENSIVO'],
  ['GIRO', 'ROLL', 'GIRO'],
  ['BOMBA', 'BOMB', 'BOMBA'],
  ['TIRO', 'FIRE', 'DISPARO'],
  ['FLIGHT SQUADRON', 'FLIGHT SQUADRON', 'ESCUADRÓN DE VUELO'],
  [
    'Cinco gatos. Suprimentos roubados. Uma perseguição galáctica.',
    'Five cats. Stolen supplies. A galactic pursuit.',
    'Cinco gatos. Suministros robados. Una persecución galáctica.',
  ],
  ['ESPECIALIDADE', 'SPECIALTY', 'ESPECIALIDAD'],
  ['Ataque · potência', 'Attack · power', 'Ataque · potencia'],
  ['Defesa · escudo', 'Defense · shield', 'Defensa · escudo'],
  ['Espiritual · magia', 'Spirit · magic', 'Espíritu · magia'],
  ['01 / ESCOLHA O PILOTO', '01 / CHOOSE YOUR PILOT', '01 / ELIGE PILOTO'],
  ['NAVE DE COMBATE / 360°', 'COMBAT SHIP / 360°', 'NAVE DE COMBATE / 360°'],
  ['PILOTO / ESCULTURA 3D', 'PILOT / 3D SCULPTURE', 'PILOTO / ESCULTURA 3D'],
  ['NAVE 360°', 'SHIP 360°', 'NAVE 360°'],
  ['PILOTO 360°', 'PILOT 360°', 'PILOTO 360°'],
  ['AUTO GIRO · ON', 'AUTO ROTATE · ON', 'GIRO AUTOMÁTICO · ON'],
  ['AUTO GIRO · OFF', 'AUTO ROTATE · OFF', 'GIRO AUTOMÁTICO · OFF'],
  ['RESTAURAR', 'RESET', 'RESTABLECER'],
  [
    'ARRASTE PARA EXPLORAR · EXAMINE ANTES DO VOO',
    'DRAG TO EXPLORE · INSPECT BEFORE FLIGHT',
    'ARRASTRA PARA EXPLORAR · EXAMINA ANTES DEL VUELO',
  ],
  ['02 / ESCOLHA A NAVE', '02 / CHOOSE A SHIP', '02 / ELIGE LA NAVE'],
  ['EQUILÍBRIO', 'BALANCED', 'EQUILIBRADO'],
  ['AGILIDADE +', 'AGILITY +', 'AGILIDAD +'],
  ['DEFESA +', 'DEFENSE +', 'DEFENSA +'],
  ['COR BASE', 'BASE COLOR', 'COLOR BASE'],
  ['ARSENAL E EVOLUÇÕES', 'ARSENAL & UPGRADES', 'ARSENAL Y MEJORAS'],
  ['VER GALERIA', 'VIEW GALLERY', 'VER GALERÍA'],
  ['PULSO', 'PULSE', 'PULSO'],
  ['Cadência / cinético', 'Fire rate / kinetic', 'Cadencia / cinético'],
  ['GEADA', 'FROST', 'ESCARCHA'],
  ['Nível 3 / controle', 'Level 3 / control', 'Nivel 3 / control'],
  ['Nível 5 / combustão', 'Level 5 / burning', 'Nivel 5 / combustión'],
  ['ARCANO', 'ARCANE', 'ARCANO'],
  ['Nível 7 / perseguição', 'Level 7 / homing', 'Nivel 7 / seguimiento'],
  ['VAZIO', 'VOID', 'VACÍO'],
  ['Nível 9 / perfuração', 'Level 9 / piercing', 'Nivel 9 / perforación'],
  ['BLINDAGEM', 'ARMOR', 'BLINDAJE'],
  ['4 classes no hangar', '4 classes in the hangar', '4 clases en el hangar'],
  ['Artilharia pesada', 'Heavy artillery', 'Artillería pesada'],
  ['ESPECIAIS', 'SPECIALS', 'ESPECIALES'],
  ['Barreira / Nova / Estase', 'Barrier / Nova / Stasis', 'Barrera / Nova / Estasis'],
  ['PILOTO E NAVE', 'PILOT & SHIP', 'PILOTO Y NAVE'],
  ['INICIAR MISSÃO', 'START MISSION', 'INICIAR MISIÓN'],
  ['CONTINUAR CAMPANHA ↗', 'CONTINUE CAMPAIGN ↗', 'CONTINUAR CAMPAÑA ↗'],
  ['♪ OUVIR TEMA', '♪ PLAY THEME', '♪ ESCUCHAR TEMA'],
  ['♪ PAUSAR TEMA', '♪ PAUSE THEME', '♪ PAUSAR TEMA'],
  ['▶ VER ABERTURA', '▶ WATCH INTRO', '▶ VER INTRO'],
  ['Como jogar', 'How to play', 'Cómo jugar'],
  ['WASD / setas', 'WASD / arrows', 'WASD / flechas'],
  ['pilotar ·', 'steer ·', 'pilotar ·'],
  ['Espaço', 'Space', 'Espacio'],
  ['atirar', 'fire', 'disparar'],
  [
    'câmera: perseguição / cockpit / combate',
    'camera: chase / cockpit / combat',
    'cámara: persecución / cabina / combate',
  ],
  ['boost ·', 'boost ·', 'impulso ·'],
  ['giro ·', 'roll ·', 'giro ·'],
  ['bomba', 'bomb', 'bomba'],
  ['lançar/recolher pods ·', 'launch/recall pods ·', 'lanzar/recoger pods ·'],
  ['pausar', 'pause', 'pausa'],
  [
    'No celular, use os controles de toque. Jogue na horizontal.',
    'On mobile, use touch controls. Play in landscape.',
    'En móvil, usa los controles táctiles. Juega en horizontal.',
  ],
  [
    'WEB: F troca arma · H escolhe especial · G ativa · J/L orbitam chefes. Anéis e abates dão XP para evolução contínua. Gelo retarda, plasma queima, arcano busca e vazio perfura. Pods acoplados amplificam tiros; lançados perseguem alvos. Chefes: flancos ±60° para geradores e frente 0° para núcleo.',
    'WEB: F switches weapons · H selects a special · G activates · J/L orbit bosses. Rings and kills grant XP. Ice slows, plasma burns, arcane seeks, void pierces. Attached pods amplify shots; detached pods hunt targets. Bosses: ±60° flanks for generators and 0° front for the core.',
    'WEB: F cambia arma · H elige especial · G activa · J/L orbitan jefes. Los anillos y enemigos dan XP. El hielo ralentiza, el plasma quema, el arcano persigue y el vacío perfora. Los pods acoplados potencian disparos; separados persiguen objetivos. Jefes: flancos ±60° para generadores y frente 0° para núcleo.',
  ],
  ['ATÉ A GALÁXIA MAIS DISTANTE.', 'TO THE FARTHEST GALAXY.', 'HASTA LA GALAXIA MÁS LEJANA.'],
  ['NARRADOR', 'NARRATOR', 'NARRADOR'],
  ['PULAR / INICIAR VOO ↗', 'SKIP / START FLIGHT ↗', 'SALTAR / INICIAR VUELO ↗'],
  [
    'ENTER, ESPAÇO OU ESC PARA PULAR',
    'ENTER, SPACE OR ESC TO SKIP',
    'ENTER, ESPACIO O ESC PARA SALTAR',
  ],
  ['FIVE CATS / MISSÃO', 'FIVE CATS / MISSION', 'FIVE CATS / MISIÓN'],
  ['MISSÃO PAUSADA', 'MISSION PAUSED', 'MISIÓN EN PAUSA'],
  ['CONTINUAR', 'RESUME', 'CONTINUAR'],
  ['REINICIAR FASE', 'RESTART STAGE', 'REINICIAR FASE'],
  ['SAIR PARA O MENU', 'RETURN TO MENU', 'VOLVER AL MENÚ'],
  ['CANCELAR', 'CANCEL', 'CANCELAR'],
  ['CONFIRMAR', 'CONFIRM', 'CONFIRMAR'],
  ['OPÇÕES', 'SETTINGS', 'OPCIONES'],
  ['IDIOMA', 'LANGUAGE', 'IDIOMA'],
  ['Português', 'Português', 'Português'],
  ['VOLUME GERAL', 'MASTER VOLUME', 'VOLUMEN GENERAL'],
  ['MÚSICA', 'MUSIC', 'MÚSICA'],
  ['EFEITOS', 'SOUND EFFECTS', 'EFECTOS'],
  ['SENSIBILIDADE DO TOQUE', 'TOUCH SENSITIVITY', 'SENSIBILIDAD TÁCTIL'],
  ['OPACIDADE DOS BOTÕES', 'BUTTON OPACITY', 'OPACIDAD DE BOTONES'],
  ['LEGENDAS', 'SUBTITLES', 'SUBTÍTULOS'],
  ['ABERTURA AUTOMÁTICA', 'AUTO PLAY INTRO', 'INTRO AUTOMÁTICA'],
  ['VIBRAÇÃO', 'VIBRATION', 'VIBRACIÓN'],
  ['CONTROLES PARA CANHOTOS', 'LEFT-HANDED CONTROLS', 'CONTROLES PARA ZURDOS'],
  ['FECHAR', 'CLOSE', 'CERRAR'],
  ['ATIVO', 'ACTIVE', 'ACTIVO'],
  ['FIVE CATS / HANGAR ORBITAL', 'FIVE CATS / ORBITAL HANGAR', 'FIVE CATS / HANGAR ORBITAL'],
  ['SETOR LIBERTADO', 'SECTOR LIBERATED', 'SECTOR LIBERADO'],
  [
    'Equipe a NOVA-7 antes do próximo salto. Melhorias e créditos acompanham seu checkpoint.',
    'Equip NOVA-7 before the next jump. Upgrades and credits persist in your checkpoint.',
    'Equipa la NOVA-7 antes del próximo salto. Las mejoras y créditos se guardan en tu punto de control.',
  ],
  ['CANHÃO', 'CANNON', 'CAÑÓN'],
  ['POD ORBITAL', 'ORBITAL POD', 'POD ORBITAL'],
  ['REPARAR', 'REPAIR', 'REPARAR'],
  ['PINTURAS DA NOVA-7', 'NOVA-7 PAINT JOBS', 'PINTURAS DE NOVA-7'],
  [
    'Visual da nave · sem alteração de atributos',
    'Ship appearance · stats unchanged',
    'Aspecto de la nave · sin cambiar atributos',
  ],
  ['BRASA', 'EMBER', 'BRASA'],
  ['AURORA', 'AURORA', 'AURORA'],
  ['NEBULOSA', 'NEBULA', 'NEBULOSA'],
  ['OURO', 'GOLD', 'ORO'],
  ['SAL TAR', 'JUMP', 'SALTAR'],
  ['SALTAR PARA O PRÓXIMO SETOR ↗', 'JUMP TO NEXT SECTOR ↗', 'SALTAR AL SIGUIENTE SECTOR ↗'],
  [
    'Checkpoint salvo neste navegador quando o armazenamento estiver disponível.',
    'Checkpoint saved in this browser when storage is available.',
    'Punto de control guardado en este navegador cuando haya almacenamiento disponible.',
  ],
  ['MISSÃO ENCERRADA', 'MISSION ENDED', 'MISIÓN TERMINADA'],
  ['VOAR NOVAMENTE ↗', 'FLY AGAIN ↗', 'VOLVER A VOLAR ↗'],
  [
    'Seu navegador não conseguiu iniciar o 3D. Ative a aceleração gráfica e recarregue.',
    'Your browser could not start 3D. Enable hardware acceleration and reload.',
    'Tu navegador no pudo iniciar 3D. Activa la aceleración gráfica y recarga.',
  ],
  [
    'Visualização 3D indisponível neste dispositivo. A seleção continua disponível.',
    '3D preview is unavailable on this device. Selection is still available.',
    'La vista 3D no está disponible en este dispositivo. La selección sigue disponible.',
  ],
  ['BLOCO I · ASCENSÃO', 'BLOCK I · ASCENT', 'BLOQUE I · ASCENSO'],
  ['BLOCO II · DEVASTADOR', 'BLOCK II · DEVASTATOR', 'BLOQUE II · DEVASTADOR'],
  ['CIDADE DAS MÁQUINAS', 'CITY OF MACHINES', 'CIUDAD DE LAS MÁQUINAS'],
  ['DISTRITO PORTUÁRIO', 'HARBOR DISTRICT', 'DISTRITO PORTUARIO'],
  ['CINTURÃO DE DESTROÇOS', 'DEBRIS BELT', 'CINTURÓN DE ESCOMBROS'],
  ['ESTAÇÃO ÓRBITA-9', 'ORBIT-9 STATION', 'ESTACIÓN ÓRBITA-9'],
  ['TEMPESTADE DE DADOS', 'DATA STORM', 'TORMENTA DE DATOS'],
  ['SETOR CONGELADO', 'FROZEN SECTOR', 'SECTOR CONGELADO'],
  ['NÚCLEO PÚRPURA', 'PURPLE CORE', 'NÚCLEO PÚRPURA'],
  ['GRADE DE BATALHA', 'BATTLE GRID', 'RED DE BATALLA'],
  ['ABISMO DE ÓRION', 'ORION ABYSS', 'ABISMO DE ORIÓN'],
  ['TRONO DE MARVIN', "MARVIN'S THRONE", 'TRONO DE MARVIN'],
  ['CAÇA-LÍDER ROK', 'ROK LEADER FIGHTER', 'CAZA LÍDER ROK'],
  ['NAVE-FERRÃO', 'STINGER SHIP', 'NAVE AGUIJÓN'],
  ['PERFURADOR', 'DRILLER', 'PERFORADOR'],
  ['FORTALEZA ÓRBITA', 'ORBITAL FORTRESS', 'FORTALEZA ORBITAL'],
  ['FÊNIX DE PLASMA', 'PLASMA PHOENIX', 'FÉNIX DE PLASMA'],
  ['COLOSSO GLACIAL', 'GLACIAL COLOSSUS', 'COLOSO GLACIAL'],
  ['COLMEIA VIVA', 'LIVING HIVE', 'COLMENA VIVA'],
  ['COURAÇADO ÔMEGA', 'OMEGA DREADNOUGHT', 'ACORAZADO OMEGA'],
  ['NÚCLEO BASTIÃO', 'BASTION CORE', 'NÚCLEO BASTIÓN'],
  ['IMPERADOR MARVIN', 'EMPEROR MARVIN', 'EMPERADOR MARVIN'],
  [
    'Bia, liberte a costa. As torres alimentam a frota de Marvin.',
    "Bia, free the coast. The towers power Marvin's fleet.",
    'Bia, libera la costa. Las torres alimentan la flota de Marvin.',
  ],
  [
    'Bob detectou uma máquina colossal sob o porto. Proteja a rota de fuga.',
    'Bob detected a colossal machine beneath the harbor. Protect the escape route.',
    'Bob detectó una máquina colosal bajo el puerto. Protege la ruta de escape.',
  ],
  [
    'Subindo para a órbita. Atravesse os destroços sem perder os pods.',
    'Ascending to orbit. Cross the debris without losing the pods.',
    'Subiendo a la órbita. Cruza los escombros sin perder los pods.',
  ],
  [
    'Christopher encontrou o núcleo da estação. Desative os geradores externos.',
    'Christopher located the station core. Disable the outer generators.',
    'Christopher encontró el núcleo de la estación. Desactiva los generadores externos.',
  ],
  [
    'A rede entrou em colapso. Cuidado com as rajadas de plasma.',
    'The network has collapsed. Watch out for plasma barrages.',
    'La red colapsó. Cuidado con las ráfagas de plasma.',
  ],
  [
    'Bloco dois. Um colosso protege os depósitos de energia de Marvin.',
    "Block two. A colossus guards Marvin's energy reserves.",
    'Bloque dos. Un coloso protege los depósitos de energía de Marvin.',
  ],
  [
    'A biofrota reage aos nossos sinais. Quebre as cabeças da colmeia.',
    'The biofleet is reacting to our signals. Break the hive heads.',
    'La bioflota reacciona a nuestras señales. Destruye las cabezas de la colmena.',
  ],
  [
    'Toda a frota está aqui. Guarde uma bomba para a barragem.',
    'The entire fleet is here. Save a bomb for the barrage.',
    'Toda la flota está aquí. Guarda una bomba para la barrera.',
  ],
  [
    'Sem sinal da Terra. Siga o disco de acreção até o Bastião.',
    'No signal from Earth. Follow the accretion disk to the Bastion.',
    'Sin señal de la Tierra. Sigue el disco de acreción hasta el Bastión.',
  ],
  [
    'Five Cats reunidos. A Devastador está à frente. Termine esta guerra.',
    'Five Cats reunited. The Devastator lies ahead. End this war.',
    'Los Five Cats reunidos. El Devastador está delante. Termina esta guerra.',
  ],
  [
    'Marvin roubou os suprimentos dos gatos e fugiu para o espaço profundo.',
    "Marvin stole the cats' supplies and escaped into deep space.",
    'Marvin robó los suministros de los gatos y huyó al espacio profundo.',
  ],
  [
    'A perseguição irá até a galáxia mais distante. Marvin não vai escapar.',
    "We'll chase him to the farthest galaxy. Marvin won't escape.",
    'Lo perseguiremos hasta la galaxia más lejana. Marvin no escapará.',
  ],
  [
    'Armas prontas. Vamos atrás dele.',
    "Weapons ready. Let's go after him.",
    'Armas listas. Vamos tras él.',
  ],
  [
    'O sinal está se afastando. Vamos acelerar!',
    "The signal is getting weaker. Let's speed up!",
    'La señal se aleja. ¡Vamos a acelerar!',
  ],
  ['COMANDANTE VANGUARDA', 'VANGUARD COMMANDER', 'COMANDANTE DE VANGUARDIA'],
  ['GUARDIÃO DE CERCO', 'SIEGE GUARDIAN', 'GUARDIÁN DE ASEDIO'],
  ['ARTILHEIRO PESADO', 'HEAVY GUNNER', 'ARTILLERO PESADO'],
  ['MÍSTICO DO VAZIO', 'VOID MYSTIC', 'MÍSTICO DEL VACÍO'],
  ['INTERCEPTADORA', 'INTERCEPTOR', 'INTERCEPTORA'],
  ['MULTIFUNÇÃO', 'MULTIPURPOSE', 'MULTIFUNCIÓN'],
  ['INTERCEPTADOR', 'INTERCEPTOR', 'INTERCEPTOR'],
  ['FORTALEZA', 'FORTRESS', 'FORTALEZA'],
  ['SOBRECARGA', 'OVERCHARGE', 'SOBRECARGA'],
  ['Sobrecarga', 'Overcharge', 'Sobrecarga'],
  ['Muralha orbital', 'Orbital Wall', 'Muralla orbital'],
  ['Impacto gravitacional', 'Gravitational Impact', 'Impacto gravitacional'],
  ['Fluxo arcano', 'Arcane Flow', 'Flujo arcano'],
  ['Instinto de caça', 'Hunter Instinct', 'Instinto de caza'],
  [
    'A gatinha preta que lidera o esquadrão. Potência ofensiva e tiros carregados.',
    'The black cat leading the squad. Offensive power and charged shots.',
    'La gatita negra que lidera el escuadrón. Potencia ofensiva y disparos cargados.',
  ],
  [
    'Gato preto, um pouco menor que Christopher. Escudo e vida para combates prolongados.',
    'A black cat, slightly smaller than Christopher. Shield and health for long fights.',
    'Gato negro, un poco más pequeño que Christopher. Escudo y vida para combates prolongados.',
  ],
  [
    'O maior e mais forte dos gatos. Casco resistente e bombas de alto impacto.',
    'The largest and strongest cat. Tough hull and heavy-impact bombs.',
    'El gato más grande y fuerte. Blindaje resistente y bombas de gran impacto.',
  ],
  [
    'Pequeno e com pouco pelo. Recarga espiritual acelerada para dominar os especiais.',
    'Small and short-haired. Faster spirit recharge to dominate specials.',
    'Pequeño y con poco pelo. Recarga espiritual acelerada para dominar los especiales.',
  ],
  [
    'Gata cinza do tamanho da Bia. Ágil para perseguir alvos e escapar do fogo inimigo.',
    'Gray cat the same size as Bia. Agile at chasing targets and dodging enemy fire.',
    'Gata gris del tamaño de Bia. Ágil para perseguir objetivos y esquivar el fuego enemigo.',
  ],
  [
    'Chassi equilibrado com boa resposta em qualquer especialidade.',
    'Balanced chassis with solid response for every specialty.',
    'Chasis equilibrado con buena respuesta en cualquier especialidad.',
  ],
  [
    'Asas compactas, aceleração superior e menor blindagem.',
    'Compact wings, better acceleration and lighter armor.',
    'Alas compactas, mayor aceleración y menor blindaje.',
  ],
  [
    'Placas reforçadas e estabilidade, com resposta mais pesada.',
    'Reinforced plates and stability, with heavier handling.',
    'Placas reforzadas y estabilidad, con respuesta más pesada.',
  ],
  ['EVOLUÇÃO', 'LEVEL UP', 'EVOLUCIÓN'],
  ['POTÊNCIA AUMENTADA', 'POWER INCREASED', 'POTENCIA AUMENTADA'],
  ['ENERGIA ARCANA INSUFICIENTE', 'NOT ENOUGH ARCANE ENERGY', 'ENERGÍA ARCANA INSUFICIENTE'],
  ['ESCUDO +25', 'SHIELD +25', 'ESCUDO +25'],
  ['NAVE PERDIDA', 'SHIP LOST', 'NAVE PERDIDA'],
  ['ASSUMINDO O COMANDO', 'TAKING CONTROL', 'TOMANDO EL MANDO'],
  [
    'CRUZADOR DESTRUÍDO / ROTA LIBERADA',
    'CRUISER DESTROYED / ROUTE OPEN',
    'CRUCERO DESTRUIDO / RUTA LIBERADA',
  ],
  [
    'BASE DESTRUÍDA · ARMA E ESCUDO RECUPERADOS',
    'BASE DESTROYED · WEAPON AND SHIELD RESTORED',
    'BASE DESTRUIDA · ARMA Y ESCUDO RESTAURADOS',
  ],
  [
    'ARENA · J/L OU ↶/↷ PARA ORBITAR · GERADORES NOS FLANCOS',
    'ARENA · J/L OR ↶/↷ TO ORBIT · GENERATORS ON FLANKS',
    'ARENA · J/L O ↶/↷ PARA ORBITAR · GENERADORES EN FLANCOS',
  ],
  ['ALERTA COLOSSAL', 'COLOSSUS ALERT', 'ALERTA DE COLOSO'],
  [
    'DESTRUA OS GERADORES VERMELHOS',
    'DESTROY THE RED GENERATORS',
    'DESTRUYE LOS GENERADORES ROJOS',
  ],
  ['GERADOR DESTRUÍDO', 'GENERATOR DESTROYED', 'GENERADOR DESTRUIDO'],
  ['NÚCLEO EXPOSTO', 'CORE EXPOSED', 'NÚCLEO EXPUESTO'],
  ['MIRE NO OUTRO GERADOR', 'AIM AT THE OTHER GENERATOR', 'APUNTA AL OTRO GENERADOR'],
  ['COLAPSO DO REATOR', 'REACTOR COLLAPSE', 'COLAPSO DEL REACTOR'],
  ['REATOR INSTÁVEL / AFASTE-SE', 'REACTOR UNSTABLE / GET CLEAR', 'REACTOR INESTABLE / ALÉJATE'],
  ['ALVO DESTRUÍDO', 'TARGET DESTROYED', 'OBJETIVO DESTRUIDO'],
  [
    'MARVIN DERROTADO · SUPRIMENTOS RECUPERADOS',
    'MARVIN DEFEATED · SUPPLIES RECOVERED',
    'MARVIN DERROTADO · SUMINISTROS RECUPERADOS',
  ],
  ['A TERRA ESTÁ LIVRE', 'EARTH IS FREE', 'LA TIERRA ES LIBRE'],
  ['NAVE ABATIDA', 'SHIP DESTROYED', 'NAVE DERRIBADA'],
  [
    'Marvin derrotado. Os suprimentos estão de volta. Five Cats, missão cumprida.',
    'Marvin defeated. The supplies are back. Five Cats, mission complete.',
    'Marvin derrotado. Los suministros regresaron. Five Cats, misión cumplida.',
  ],
  [
    'Use o giro para bloquear disparos e os anéis para recuperar escudo.',
    'Use the defensive roll to block shots and rings to restore your shield.',
    'Usa el giro defensivo para bloquear disparos y los anillos para recuperar escudo.',
  ],
  ['MISSÃO CUMPRIDA', 'MISSION COMPLETE', 'MISIÓN CUMPLIDA'],
  ['TENTE NOVAMENTE', 'TRY AGAIN', 'INTÉNTALO DE NUEVO'],
  ['Missão retomada.', 'Mission resumed.', 'Misión reanudada.'],
  [
    'IMPULSO ESGOTADO / SOLTE SHIFT OU BOOST PARA REARMAR',
    'BOOST DEPLETED / RELEASE SHIFT OR BOOST TO RESET',
    'IMPULSO AGOTADO / SUELTA SHIFT O BOOST PARA REARMAR',
  ],
  [
    'FENDA ESPACIAL / VISÃO LATERAL · MOVA, ATIRE E RECOLHA CRÉDITOS',
    'SPACE RIFT / SIDE VIEW · MOVE, FIRE AND COLLECT CREDITS',
    'GRIETA ESPACIAL / VISTA LATERAL · MUÉVETE, DISPARA Y RECOGE CRÉDITOS',
  ],
  [
    'CAÇA RIVAL / NÃO DEIXE QUE ELE ENCERRE A MISSÃO',
    "RIVAL FIGHTER / DON'T LET IT END YOUR MISSION",
    'CAZA RIVAL / NO DEJES QUE TERMINE TU MISIÓN',
  ],
  [
    'BASE-SERVIDOR / ELIMINE A TORRE PARA RECEBER SUPRIMENTOS',
    'SERVER BASE / DESTROY THE TOWER FOR SUPPLIES',
    'BASE SERVIDOR / DESTRUYE LA TORRE PARA OBTENER SUMINISTROS',
  ],
  [
    'TÚNEL INDUSTRIAL / SIGA AS SETAS E ELIMINE A DEFESA TERRESTRE',
    'INDUSTRIAL TUNNEL / FOLLOW THE ARROWS AND ELIMINATE GROUND DEFENSES',
    'TÚNEL INDUSTRIAL / SIGUE LAS FLECHAS Y ELIMINA LAS DEFENSAS TERRESTRES',
  ],
  ['LANÇAR', 'LAUNCH', 'LANZAR'],
  ['VOLTAR', 'RECALL', 'VOLVER'],
  ['⚠ CANHÕES CARREGANDO', '⚠ CANNONS CHARGING', '⚠ CAÑONES CARGANDO'],
  ['FRA CO', 'WEAK', 'DÉBIL'],
  ['CONTRA-ATAQUE', 'COUNTERATTACK', 'CONTRAATAQUE'],
  ['RISCO', 'DANGER', 'RIESGO'],
  ['COBERTURA', 'COVER', 'COBERTURA'],
  ['APROXIMAÇÃO', 'APPROACH', 'ACERCAMIENTO'],
  ['BLINDAGEM ATIVA', 'ARMOR ACTIVE', 'BLINDAJE ACTIVO'],
  [
    'ÚLTIMA RESISTÊNCIA DE MARVIN · NÚCLEO EXPOSTO',
    "MARVIN'S LAST STAND · CORE EXPOSED",
    'ÚLTIMA RESISTENCIA DE MARVIN · NÚCLEO EXPUESTO',
  ],
  [
    'ÚLTIMA RESISTÊNCIA DE MARVIN · BLINDAGEM ATIVA',
    "MARVIN'S LAST STAND · ARMOR ACTIVE",
    'ÚLTIMA RESISTENCIA DE MARVIN · BLINDAJE ACTIVO',
  ],
  ['LEQUE DUPLO', 'DOUBLE FAN', 'ABANICO DOBLE'],
  ['PINÇAS', 'PINCERS', 'PINZAS'],
  ['HÉLICE', 'PROPELLER', 'HÉLICE'],
  ['CRUZ ORBITAL', 'ORBITAL CROSS', 'CRUZ ORBITAL'],
  ['ASAS DE FOGO', 'FIRE WINGS', 'ALAS DE FUEGO'],
  ['MARTELO', 'HAMMER', 'MARTILLO'],
  ['CABEÇAS DA HIDRA', 'HYDRA HEADS', 'CABEZAS DE HIDRA'],
  ['BATERIAS', 'BATTERIES', 'BATERÍAS'],
  ['ANEL DO VAZIO', 'VOID RING', 'ANILLO DEL VACÍO'],
  ['COROA IMPERIAL', 'IMPERIAL CROWN', 'CORONA IMPERIAL'],
  ['BATERIA FRONTAL', 'FRONT BATTERY', 'BATERÍA FRONTAL'],
  ['PINÇA LATERAL', 'SIDE PINCER', 'PINZA LATERAL'],
  ['INVESTIDA', 'CHARGE', 'EMBESTIDA'],
  ['VARREDURA', 'SWEEP', 'BARRIDO'],
  ['MERGULHO SOLAR', 'SOLAR DIVE', 'PICADO SOLAR'],
  ['MARTELO GRAVÍTICO', 'GRAVITY HAMMER', 'MARTILLO GRAVITATORIO'],
  ['CAÇADA TRIPLA', 'TRIPLE HUNT', 'CAZA TRIPLE'],
  ['CERCO', 'SIEGE', 'ASEDIO'],
  ['PULSO DO VAZIO', 'VOID PULSE', 'PULSO DEL VACÍO'],
  ['ECLIPSE', 'ECLIPSE', 'ECLIPSE'],
  ['PULSO MK-I', 'PULSE MK-I', 'PULSO MK-I'],
  ['GÊMEO MK-II', 'TWIN MK-II', 'GEMELO MK-II'],
  ['TRÍADE MK-III', 'TRIAD MK-III', 'TRÍADA MK-III'],
  ['PLASMA VÓRTICE', 'VORTEX PLASMA', 'PLASMA VÓRTICE'],
  ['PLASMA NOVA', 'NOVA PLASMA', 'PLASMA NOVA'],
  ['ANIQUILADOR Ω', 'ANNIHILATOR Ω', 'ANIQUILADOR Ω'],
  ['REPARAR ESCUDO', 'REPAIR SHIELD', 'REPARAR ESCUDO'],
  ['POD ORBITAL', 'ORBITAL POD', 'POD ORBITAL'],
  ['MÁXIMO', 'MAXIMUM', 'MÁXIMO'],
  ['ATAQUE', 'ATTACK', 'ATAQUE'],
  ['DEFESA', 'DEFENSE', 'DEFENSA'],
  ['AGILIDADE', 'AGILITY', 'AGILIDAD'],
  ['FORÇA', 'STRENGTH', 'FUERZA'],
  ['VIDA', 'HEALTH', 'VIDA'],
  ['ESPÍRITO', 'SPIRIT', 'ESPÍRITU'],
  ['LATINHA', 'FOOD CAN', 'LATA'],
  ['PETISCO', 'TREAT', 'PREMIO'],
  ['BRINQUEDO', 'TOY', 'JUGUETE'],
  ['AREIA', 'LITTER', 'ARENA'],
  ['CUIDADOS', 'PET CARE', 'CUIDADOS'],
  ['RESGATADO', 'RECOVERED', 'RESCATADO'],
  ['CUIDE DOS FIVE CATS', 'CARE FOR FIVE CATS', 'CUIDA A LOS FIVE CATS'],
  ['CAMINHO DA VITÓRIA', 'PATH TO VICTORY', 'CAMINO A LA VICTORIA'],
  ['SALTAR', 'JUMP', 'SALTAR'],
  ['PRÓXIMO', 'NEXT', 'SIGUIENTE'],
  ['LIBERTADO', 'LIBERATED', 'LIBERADO'],
  ['SETOR', 'SECTOR', 'SECTOR'],
  ['GERADORES', 'GENERATORS', 'GENERADORES'],
  ['GERADOR', 'GENERATOR', 'GENERADOR'],
  ['ESCUDO', 'SHIELD', 'ESCUDO'],
  ['ENERGIA', 'ENERGY', 'ENERGÍA'],
  ['FASE', 'PHASE', 'FASE'],
  ['VIDAS', 'LIVES', 'VIDAS'],
  ['ACERTOS', 'HITS', 'ACIERTOS'],
];
const MAP = new Map(ROWS.map(([pt, en, es]) => [pt, { en, es }]));

// Dynamic terms and inflected labels used in HUD strings created at runtime.
const ADDITIONAL = [
  [
    '⚠ ALERTA · CHEFE SE APROXIMANDO',
    '⚠ WARNING · BOSS APPROACHING',
    '⚠ ALERTA · SE ACERCA UN JEFE',
  ],
  ['ACERTO', 'HIT', 'IMPACTO'],
  ['SEM DANO', 'NO DAMAGE', 'SIN DAÑO'],
  ['SEM DANO · AJUSTE O ÂNGULO', 'NO DAMAGE · CHANGE ANGLE', 'SIN DAÑO · CAMBIA EL ÁNGULO'],
  ['PONTO FRACO', 'WEAK POINT', 'PUNTO DÉBIL'],
  ['PRÓXIMO:', 'NEXT:', 'SIGUIENTE:'],
  ['ARMA', 'WEAPON', 'ARMA'],
  [' · EQUIPADA', ' · EQUIPPED', ' · EQUIPADA'],
  [' · EQUIPAR', ' · EQUIP', ' · EQUIPAR'],
  ['PILOTO E NAVE', 'PILOT & SHIP', 'PILOTO Y NAVE'],
  [
    'Pilote a NOVA-7 com Bia e os Five Cats. Combate aéreo 3D na Cidade das Máquinas, no teclado ou no celular.',
    'Pilot NOVA-7 with Bia and the Five Cats. 3D aerial combat in the City of Machines, on keyboard or mobile.',
    'Pilota la NOVA-7 con Bia y los Five Cats. Combate aéreo 3D en la Ciudad de las Máquinas, con teclado o móvil.',
  ],
  ['Direção dos disparos', 'Direction of fire', 'Dirección de los disparos'],
  [
    'Cinco gatos. Suprimentos roubados. Uma perseguição galáctica.',
    'Five cats. Stolen supplies. A galactic pursuit.',
    'Cinco gatos. Suministros robados. Una persecución galáctica.',
  ],
  ['ASCENSÃO ORBITAL', 'ORBITAL ASCENT', 'ASCENSO ORBITAL'],
  ['CURVA À DIREITA', 'RIGHT TURN', 'GIRO A LA DERECHA'],
  ['CURVA À ESQUERDA', 'LEFT TURN', 'GIRO A LA IZQUIERDA'],
  ['ROTA DE APROXIMAÇÃO', 'APPROACH ROUTE', 'RUTA DE APROXIMACIÓN'],
  ['CRUZADOR ROK', 'ROK CRUISER', 'CRUCERO ROK'],
  ['ARRAIA ABISSAL', 'ABYSSAL RAY', 'RAYA ABISAL'],
  ['BROCA SENTINELA', 'SENTINEL DRILL', 'BROCA CENTINELA'],
  ['SATÉLITE CRUZADO', 'CROSS SATELLITE', 'SATÉLITE CRUZADO'],
  ['AVE SOLAR', 'SOLAR BIRD', 'AVE SOLAR'],
  ['CARANGUEJO GLACIAL', 'GLACIAL CRAB', 'CANGREJO GLACIAL'],
  ['MEDUSA VIVA', 'LIVING JELLYFISH', 'MEDUSA VIVA'],
  ['FORTIM ÔMEGA', 'OMEGA FORT', 'FORTÍN OMEGA'],
  ['PRISMA DO VAZIO', 'VOID PRISM', 'PRISMA DEL VACÍO'],
  ['GUARDIÃO DA COROA', 'CROWN GUARDIAN', 'GUARDIÁN DE LA CORONA'],
  [
    'Jogo 3D Nova Wing, combate aéreo na Cidade das Máquinas',
    'Nova Wing 3D game, aerial combat in the City of Machines',
    'Juego 3D Nova Wing, combate aéreo en la Ciudad de las Máquinas',
  ],
  ['Desafio de nave 2D', '2D ship challenge', 'Desafío de nave 2D'],
  ['Reservas táticas', 'Tactical reserves', 'Reservas tácticas'],
  ['Trocar arma', 'Switch weapon', 'Cambiar arma'],
  ['Escolher especial', 'Choose special', 'Elegir especial'],
  ['Ativar especial', 'Activate special', 'Activar especial'],
  ['Orbitar chefe à esquerda', 'Orbit boss left', 'Orbitar jefe a la izquierda'],
  ['Orbitar chefe à direita', 'Orbit boss right', 'Orbitar jefe a la derecha'],
  ['Alternar câmera', 'Switch camera', 'Cambiar cámara'],
  ['Radar de combate orbital', 'Orbital combat radar', 'Radar de combate orbital'],
  ['Reservas de ação', 'Action reserves', 'Reservas de acción'],
  ['Confirmação de impacto', 'Hit confirmation', 'Confirmación de impacto'],
  [
    'Itens resgatados para cuidar dos gatos',
    'Recovered cat-care supplies',
    'Objetos rescatados para cuidar a los gatos',
  ],
  ['Ativar ou desativar música', 'Toggle music', 'Activar o desactivar música'],
  ['Ativar ou desativar som', 'Toggle sound', 'Activar o desactivar sonido'],
  ['Pausar jogo', 'Pause game', 'Pausar juego'],
  ['Direcional virtual', 'Virtual joystick', 'Joystick virtual'],
  ['Menu principal', 'Main menu', 'Menú principal'],
  ['Seleção dos Five Cats', 'Five Cats selection', 'Selección de Five Cats'],
  ['Pilotos disponíveis', 'Available pilots', 'Pilotos disponibles'],
  [
    'Hangar de inspeção 360 graus',
    '360-degree inspection hangar',
    'Hangar de inspección de 360 grados',
  ],
  ['Objeto em inspeção', 'Object under inspection', 'Objeto en inspección'],
  [
    'Modelo 3D. Arraste para girar; setas inclinam e giram, mais e menos ajustam o zoom, Home restaura.',
    '3D model. Drag to rotate; arrow keys tilt and rotate, plus and minus zoom, Home resets.',
    'Modelo 3D. Arrastra para girar; las flechas inclinan y giran, más y menos hacen zoom, Home restablece.',
  ],
  ['Controles de inspeção', 'Inspection controls', 'Controles de inspección'],
  ['Girar para a esquerda', 'Rotate left', 'Girar a la izquierda'],
  ['Girar para a direita', 'Rotate right', 'Girar a la derecha'],
  ['Afastar', 'Zoom out', 'Alejar'],
  ['Aproximar', 'Zoom in', 'Acercar'],
  ['Atributos do piloto', 'Pilot attributes', 'Atributos del piloto'],
  ['Modelos de nave', 'Ship models', 'Modelos de nave'],
  ['Cor base da nave', 'Ship base color', 'Color base de la nave'],
  [
    'Ouvir ou pausar a trilha do menu',
    'Play or pause menu music',
    'Escuchar o pausar la música del menú',
  ],
  ['Assistir à abertura de Nova Wing', 'Watch Nova Wing intro', 'Ver introducción de Nova Wing'],
  [
    'Abertura da campanha Five Cats',
    'Five Cats campaign intro',
    'Introducción de campaña Five Cats',
  ],
  ['Pular abertura', 'Skip intro', 'Saltar introducción'],
  ['Pausa da missão', 'Mission pause', 'Pausa de misión'],
  ['Configurações', 'Settings', 'Configuración'],
  ['Hangar de melhorias', 'Upgrade hangar', 'Hangar de mejoras'],
  ['Bia, piloto dos Five Cats', 'Bia, Five Cats pilot', 'Bia, piloto de Five Cats'],
  ['Carmesim', 'Crimson', 'Carmesí'],
  ['Cobalto', 'Cobalt', 'Cobalto'],
  ['em voo', 'in flight', 'en vuelo'],
  ['PONTOS FRACOS', 'WEAK POINTS', 'PUNTOS DÉBILES'],
  ['ALVO', 'TARGET', 'OBJETIVO'],
  ['ESPECIAL', 'SPECIAL', 'ESPECIAL'],
  ['ARCANA', 'ARCANA', 'ARCANA'],
  ['ARSENAL COMPLETO', 'ARSENAL COMPLETE', 'ARSENAL COMPLETO'],
  ['Ações rápidas de RPG', 'Quick RPG actions', 'Acciones rápidas de RPG'],
  ['Progresso de evolução', 'Evolution progress', 'Progreso de evolución'],
  [
    'Em algum lugar entre as estrelas, a paz dos Five Cats foi interrompida.',
    'Somewhere among the stars, the peace of Five Cats was shattered.',
    'En algún lugar entre las estrellas, la paz de Five Cats fue interrumpida.',
  ],
  [
    'Preparem as naves. Vamos recuperar tudo o que ele roubou.',
    'Prepare the ships. We will recover everything he stole.',
    'Preparen las naves. Recuperaremos todo lo que robó.',
  ],
  [
    'Five Cats, todos a postos. Temos um rastro para seguir.',
    'Five Cats, all stations ready. We have a trail to follow.',
    'Five Cats, todos a sus puestos. Tenemos un rastro que seguir.',
  ],
  ['CUIDADOS ·', 'PET CARE ·', 'CUIDADOS ·'],
  ['PERSEGUIÇÃO', 'CHASE', 'PERSECUCIÓN'],
  ['COMBATE', 'COMBAT', 'COMBATE'],
  ['BARREIRA', 'BARRIER', 'BARRERA'],
  ['ESTASE', 'STASIS', 'ESTASIS'],
  ['ARMAS', 'WEAPONS', 'ARMAS'],
  ['NAVE', 'SHIP', 'NAVE'],
  ['PILOTO', 'PILOT', 'PILOTO'],
  ['COCKPIT', 'COCKPIT', 'CABINA'],
  ['acertos', 'hits', 'aciertos'],
  ['de voo', 'of flight', 'de vuelo'],
  ['SEGUNDO', 'SECOND', 'SEGUNDO'],
  ['SUPERADO', 'CLEARED', 'SUPERADO'],
  ['FRACO', 'WEAK', 'DÉBIL'],
  ['VOLTA', 'BACK', 'VOLVER'],
  ['SETORES', 'SECTORS', 'SECTORES'],
  ['POD', 'POD', 'POD'],
  ['CHEFE', 'BOSS', 'JEFE'],
  ['NÚCLEO', 'CORE', 'NÚCLEO'],
  ['SOBRECARGA', 'OVERLOAD', 'SOBRECARGA'],
  ['Créditos', 'Credits', 'Créditos'],
  ['LANÇAR', 'LAUNCH', 'LANZAR'],
  ['VOLTAR À CAPA −', 'BACK TO COVER −', 'VOLVER A PORTADA −'],
  ['PILOTO E NAVE ＋', 'PILOT & SHIP ＋', 'PILOTO Y NAVE ＋'],
  ['Voltar', 'Back', 'Volver'],
  ['CUIDADOS', 'PET CARE', 'CUIDADOS'],
  ['resgatado', 'recovered', 'rescatado'],
  ['RESGATADO', 'RECOVERED', 'RESCATADO'],
  ['RECARREGAR', 'RELOAD', 'RECARGAR'],
  ['SALVO', 'SAVED', 'GUARDADO'],
  ['CIDADE', 'CITY', 'CIUDAD'],
];
for (const [pt, en, es] of ADDITIONAL) MAP.set(pt, { en, es });
const RANKING_TRANSLATIONS = [
  // Google login, guest mode, settings and accessible labels.
  ['Conta do piloto', 'Pilot account', 'Cuenta del piloto'],
  ['CONTA · PILOTO', 'ACCOUNT · PILOT', 'CUENTA · PILOTO'],
  ['Piloto visitante', 'Guest pilot', 'Piloto invitado'],
  ['Piloto Google', 'Google pilot', 'Piloto Google'],
  ['Preparando autenticação...', 'Preparing authentication...', 'Preparando autenticación...'],
  ['Entrar com Google', 'Sign in with Google', 'Iniciar sesión con Google'],
  ['Sair da conta', 'Sign out', 'Cerrar sesión'],
  ['Continuar como visitante', 'Continue as guest', 'Continuar como invitado'],
  [
    'O login é opcional. Para competir, abra RANK e aceite o registro de pontuações.',
    'Signing in is optional. To compete, open RANK and opt in to score recording.',
    'El inicio de sesión es opcional. Para competir, abre RANK y acepta registrar puntuaciones.',
  ],
  ['Sessão Google ativa', 'Google session active', 'Sesión de Google activa'],
  [
    'Modo visitante · progresso local',
    'Guest mode · local progress',
    'Modo invitado · progreso local',
  ],
  ['Conectando ao Google...', 'Connecting to Google...', 'Conectando con Google...'],
  [
    'Não foi possível verificar a sessão Google. Tente novamente.',
    'Could not verify your Google session. Try again.',
    'No se pudo verificar tu sesión de Google. Inténtalo de nuevo.',
  ],
  [
    'Não foi possível sair do Google. Sua sessão continua ativa.',
    'Could not sign out of Google. Your session remains active.',
    'No se pudo cerrar sesión de Google. Tu sesión sigue activa.',
  ],
  [
    'Não foi possível abrir o login. Tente novamente.',
    'Could not open sign-in. Try again.',
    'No se pudo abrir el inicio de sesión. Inténtalo de nuevo.',
  ],
  [
    'Login cancelado · modo visitante',
    'Sign-in cancelled · guest mode',
    'Inicio de sesión cancelado · modo invitado',
  ],
  [
    'Falha no login Google. Confira os domínios autorizados.',
    'Google sign-in failed. Check authorized domains.',
    'Error al iniciar sesión con Google. Revisa los dominios autorizados.',
  ],
  ['Não foi possível sair da conta.', 'Could not sign out.', 'No se pudo cerrar sesión.'],
  ['Verificando sessão Google...', 'Checking Google session...', 'Verificando sesión de Google...'],
  [
    'Login de produção ainda não configurado. Jogue como visitante.',
    'Production sign-in is not configured yet. Play as a guest.',
    'El acceso de producción aún no está configurado. Juega como invitado.',
  ],
  [
    'Sessão indisponível. Jogue como visitante.',
    'Session unavailable. Play as a guest.',
    'Sesión no disponible. Juega como invitado.',
  ],
  [
    'Não foi possível concluir o login Google.',
    'Could not complete Google sign-in.',
    'No se pudo completar el inicio de sesión con Google.',
  ],
  [
    'Login indisponível. Você pode jogar como visitante.',
    'Sign-in unavailable. You can play as a guest.',
    'Inicio de sesión no disponible. Puedes jugar como invitado.',
  ],

  // Ranking, opt-in, local/cloud histories and data deletion.
  [
    'Ranking e histórico de pontuação',
    'Ranking and score history',
    'Clasificación e historial de puntuaciones',
  ],
  ['RANK · HISTÓRICO', 'RANK · HISTORY', 'CLASIFICACIÓN · HISTORIAL'],
  ['RANKING FIVE CATS', 'FIVE CATS RANKING', 'CLASIFICACIÓN FIVE CATS'],
  ['Visitante · resultados locais', 'Guest · local scores', 'Invitado · puntuaciones locales'],
  [
    'Google conectado · competição opcional',
    'Google connected · optional competition',
    'Google conectado · competición opcional',
  ],
  [
    '0 fases · recorde 0 pts · total 0',
    '0 stages · best 0 pts · total 0',
    '0 fases · récord 0 pts · total 0',
  ],
  ['fases', 'stages', 'fases'],
  ['recorde', 'best', 'récord'],
  ['Apelido público', 'Public nickname', 'Apodo público'],
  [
    'Quero participar do ranking experimental e salvar minhas próximas pontuações na minha conta.',
    'I want to join the experimental ranking and save future scores to my account.',
    'Quiero participar en la clasificación experimental y guardar futuras puntuaciones en mi cuenta.',
  ],
  ['ATUALIZAR RANK', 'REFRESH RANKING', 'ACTUALIZAR CLASIFICACIÓN'],
  ['EXCLUIR MEUS DADOS NA NUVEM', 'DELETE MY CLOUD DATA', 'ELIMINAR MIS DATOS EN LA NUBE'],
  [
    'Exclui seu apelido e as pontuações remotas, após confirmação. Não exclui sua conta Google, o progresso ou as partidas deste dispositivo.',
    'After confirmation, deletes your cloud nickname and scores. Does not delete your Google account, progress or matches on this device.',
    'Tras la confirmación, elimina tu apodo y puntuaciones en la nube. No elimina tu cuenta de Google, progreso ni partidas en este dispositivo.',
  ],
  ['RANK GLOBAL · EXPERIMENTAL', 'GLOBAL RANK · EXPERIMENTAL', 'RANKING GLOBAL · EXPERIMENTAL'],
  [
    'Ranking online ainda não configurado.',
    'Online ranking not configured yet.',
    'La clasificación en línea aún no está configurada.',
  ],
  ['MEU HISTÓRICO · NA NUVEM', 'MY HISTORY · CLOUD', 'MI HISTORIAL · NUBE'],
  [
    'Entre com Google para consultar.',
    'Sign in with Google to view.',
    'Inicia sesión con Google para consultar.',
  ],
  [
    'MINHAS PARTIDAS · NESTE DISPOSITIVO',
    'MY MATCHES · THIS DEVICE',
    'MIS PARTIDAS · ESTE DISPOSITIVO',
  ],
  ['Sem partidas concluídas.', 'No completed matches.', 'No hay partidas completadas.'],
  [
    'Visitantes jogam normalmente. O histórico local não sincroniza entre aparelhos. Pontuações online são experimentais, sem verificação antifraude definitiva.',
    'Guests can play normally. Local history does not sync across devices. Online scores are experimental and not yet fully protected against cheating.',
    'Los invitados pueden jugar normalmente. El historial local no se sincroniza entre dispositivos. Las puntuaciones en línea son experimentales y aún no cuentan con verificación antifraude definitiva.',
  ],
  [
    'Sem partidas concluídas neste dispositivo.',
    'No completed stages on this device.',
    'No hay fases completadas en este dispositivo.',
  ],
  [
    'Ranking online indisponível.',
    'Online ranking unavailable.',
    'Clasificación en línea no disponible.',
  ],
  [
    'Histórico remoto indisponível.',
    'Cloud history unavailable.',
    'Historial en la nube no disponible.',
  ],
  [
    'Ranking experimental ainda sem pontuações.',
    'No experimental scores yet.',
    'Todavía no hay puntuaciones experimentales.',
  ],
  [
    'Sem partidas remotas registradas.',
    'No cloud matches recorded.',
    'No hay partidas registradas en la nube.',
  ],
  [
    'Histórico remoto temporariamente indisponível.',
    'Cloud history temporarily unavailable.',
    'Historial en la nube temporalmente no disponible.',
  ],
  [
    'Entre com Google para consultar seu histórico na nuvem.',
    'Sign in with Google to see your cloud history.',
    'Inicia sesión con Google para consultar tu historial en la nube.',
  ],
  [
    'Ranking experimental · pontuações ainda não verificadas por anticheat.',
    'Experimental ranking · scores are not yet anti-cheat verified.',
    'Clasificación experimental · puntuaciones aún no verificadas contra trampas.',
  ],
  [
    'Ranking remoto indisponível. Seu histórico local foi preservado.',
    'Cloud ranking unavailable. Your local history was preserved.',
    'Clasificación en la nube no disponible. Se conservó tu historial local.',
  ],
  [
    'Pontuação guardada neste navegador. Entre com Google e aceite o ranking para registrar partidas futuras.',
    'Score saved in this browser. Sign in with Google and opt in to record future matches.',
    'Puntuación guardada en este navegador. Inicia sesión con Google y acepta la clasificación para guardar futuras partidas.',
  ],
  [
    'Pontuação local preservada. Envio remoto não disponível.',
    'Local score preserved. Cloud upload unavailable.',
    'Puntuación local conservada. Envío a la nube no disponible.',
  ],
  [
    'Pontuação armazenada no ranking experimental (não verificada).',
    'Score saved in the experimental ranking (unverified).',
    'Puntuación guardada en la clasificación experimental (sin verificar).',
  ],
  [
    'Histórico local salvo. Não foi possível gravar esta partida no servidor.',
    'Local history saved. Could not save this match on the server.',
    'Historial local guardado. No se pudo registrar esta partida en el servidor.',
  ],
  [
    'Consulte o histórico desta conta.',
    'View this account’s history.',
    'Consulta el historial de esta cuenta.',
  ],
  [
    'Histórico local ativo. API de ranking ainda não configurada neste ambiente.',
    'Local history enabled. Ranking API not yet configured in this environment.',
    'Historial local activo. La API de clasificación aún no está configurada en este entorno.',
  ],
  [
    'Participação no ranking desativada. Seus resultados locais continuam salvos.',
    'Ranking participation disabled. Your local scores remain saved.',
    'Participación en la clasificación desactivada. Tus puntuaciones locales siguen guardadas.',
  ],
  [
    'Pontuações locais habilitadas; ranking remoto depende da API do ambiente.',
    'Local scores enabled; cloud ranking requires the environment API.',
    'Puntuaciones locales activas; la clasificación en la nube requiere la API del entorno.',
  ],
  [
    'Solicitando exclusão dos dados na nuvem...',
    'Requesting cloud data deletion...',
    'Solicitando eliminación de los datos en la nube...',
  ],
  [
    'Seu histórico remoto foi excluído.',
    'Your cloud history was deleted.',
    'Se eliminó tu historial en la nube.',
  ],
  [
    'Atualize para consultar o ranking.',
    'Refresh to view the ranking.',
    'Actualiza para consultar la clasificación.',
  ],
  [
    'Dados remotos excluídos. Suas partidas e progresso locais foram mantidos.',
    'Cloud data deleted. Your local matches and progress were kept.',
    'Datos de la nube eliminados. Se conservaron tus partidas y progreso local.',
  ],
  [
    'Não foi possível confirmar a exclusão remota. Tente novamente.',
    'Could not confirm cloud data deletion. Try again.',
    'No se pudo confirmar la eliminación de datos en la nube. Inténtalo de nuevo.',
  ],
  [
    'Excluir permanentemente seu apelido e histórico de pontuação na nuvem? O progresso e as partidas neste dispositivo serão mantidos.',
    'Permanently delete your cloud nickname and score history? Progress and matches on this device will be kept.',
    '¿Eliminar permanentemente tu apodo e historial de puntuaciones en la nube? Se conservarán el progreso y las partidas de este dispositivo.',
  ],
  [
    'Excluir permanentemente seu apelido e histórico de pontuação na nuvem? O progresso e as partidas neste dispositivo serão mantidos. Esta conta não poderá enviar novas pontuações até existir um novo processo de inscrição.',
    'Permanently delete your cloud nickname and score history? Progress and matches on this device will be kept. This account cannot upload new scores until a new enrollment process is available.',
    '¿Eliminar permanentemente tu apodo e historial de puntuaciones en la nube? Se conservarán el progreso y las partidas de este dispositivo. Esta cuenta no podrá enviar nuevas puntuaciones hasta que exista un nuevo proceso de inscripción.',
  ],
  [
    'Após excluir os dados, esta conta não poderá voltar ao ranking até existir um novo processo de inscrição.',
    'After deleting data, this account cannot rejoin the ranking until a new enrollment process is available.',
    'Tras eliminar los datos, esta cuenta no podrá volver a la clasificación hasta que exista un nuevo proceso de inscripción.',
  ],
];
for (const [pt, en, es] of RANKING_TRANSLATIONS) MAP.set(pt, { en, es });

const COMPACT_RANK_AND_LAUNCH = [
  ['⚠ SAÍDA DA TERRA', '⚠ LEAVING EARTH', '⚠ SALIENDO DE LA TIERRA'],
  ['SUBA E SEGURE', 'CLIMB AND HOLD', 'ASCIENDE Y MANTÉN'],
  ['ATÉ ESGOTAR O IMPULSO', 'UNTIL BOOST RUNS OUT', 'HASTA AGOTAR EL IMPULSO'],
  [
    'SUBA E SEGURE SHIFT / BOOST ATÉ ESGOTAR O IMPULSO',
    'CLIMB AND HOLD SHIFT / BOOST UNTIL ENERGY RUNS OUT',
    'ASCIENDE Y MANTÉN SHIFT / BOOST HASTA AGOTAR EL IMPULSO',
  ],
  [
    '⚠ CHEFE SE APROXIMANDO · SAINDO DA NAVE-MÃE',
    '⚠ BOSS APPROACHING · LAUNCHING FROM MOTHERSHIP',
    '⚠ JEFE ACERCÁNDOSE · SALIENDO DE LA NAVE NODRIZA',
  ],
  ['◈ RANK', '◈ RANK', '◈ CLASIFICACIÓN'],
  ['◉ PILOTO', '◉ PILOT', '◉ PILOTO'],
  ['Abrir ranking Five Cats', 'Open Five Cats rankings', 'Abrir la clasificación de Five Cats'],
  ['Informações do ranking', 'Ranking information', 'Información de la clasificación'],
  ['RANKING GALÁCTICO', 'GALACTIC RANKING', 'CLASIFICACIÓN GALÁCTICA'],
  ['COMO FUNCIONA', 'HOW IT WORKS', 'CÓMO FUNCIONA'],
  [
    'O ranking online é experimental e as pontuações ainda não são verificadas.',
    'Online scores are experimental and not yet verified.',
    'Las puntuaciones online son experimentales y aún no están verificadas.',
  ],
  [
    'Entre com Google e ative a participação para salvar próximas partidas. Visitantes continuam jogando; seu histórico local não sincroniza.',
    'Sign in with Google and opt in to save future matches. Guests can keep playing; local history does not sync.',
    'Inicia sesión con Google y acepta para guardar próximas partidas. Los invitados pueden jugar; el historial local no se sincroniza.',
  ],
  [
    'Excluir os dados remotos preserva o progresso local, mas bloqueia nova inscrição desta conta até existir um processo seguro de reinscrição.',
    'Deleting cloud data preserves local progress but blocks rejoining until a secure enrollment process is available.',
    'Eliminar los datos en la nube conserva el progreso local, pero impide volver hasta que exista un proceso seguro de inscripción.',
  ],
  ['MEU DESEMPENHO', 'MY STATS', 'MIS ESTADÍSTICAS'],
  ['MINHAS PARTIDAS', 'MY MATCHES', 'MIS PARTIDAS'],
  ['NA NUVEM', 'IN THE CLOUD', 'EN LA NUBE'],
  ['NESTE DISPOSITIVO', 'ON THIS DEVICE', 'EN ESTE DISPOSITIVO'],
  ['PARTICIPAR / PRIVACIDADE', 'JOIN / PRIVACY', 'PARTICIPAR / PRIVACIDAD'],
  [
    'Exclui suas pontuações remotas após confirmação, sem apagar sua conta Google ou seu progresso local. A mesma conta só poderá participar novamente após existir um novo processo de inscrição.',
    'After confirmation, deletes cloud scores without deleting your Google account or local progress. Rejoining with the same account requires a new enrollment process.',
    'Tras confirmar, elimina puntuaciones en la nube sin borrar tu cuenta de Google ni el progreso local. Volver con la misma cuenta requiere un nuevo proceso de inscripción.',
  ],
  [
    'O login Google é opcional. O ranking pode ser ativado no painel RANK.',
    'Google sign-in is optional. Enable ranking participation in the RANK panel.',
    'Iniciar sesión con Google es opcional. Activa la clasificación en el panel RANK.',
  ],
  ['Atualizar ranking', 'Refresh ranking', 'Actualizar clasificación'],
];
for (const [pt, en, es] of COMPACT_RANK_AND_LAUNCH) MAP.set(pt, { en, es });
const TOKEN_KEYS = [...MAP.keys()].filter((s) => s.length >= 4).sort((a, b) => b.length - a.length);
const escapePattern = (s) =>
  [...s].map((c) => ('.?*+^$[]{}()|\\'.includes(c) ? '\\' + c : c)).join('');
const TOKEN_RE = new RegExp(
  '(?<![\\p{L}])(' + TOKEN_KEYS.map(escapePattern).join('|') + ')(?![\\p{L}])',
  'gu',
);
export function translateText(text, lang = 'pt') {
  if (lang === 'pt' || !['en', 'es'].includes(lang) || typeof text !== 'string') return text;
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!match || !match[2]) return text;
  const exact = MAP.get(match[2]) || MAP.get(match[2].replace(/\s+/g, ' ').trim());
  if (exact) return match[1] + exact[lang] + match[3];
  // Interpolated statuses are translated by domain tokens, preserving IDs and numbers.
  const patched = match[2].replace(TOKEN_RE, (token) => MAP.get(token)?.[lang] ?? token);
  return match[1] + patched + match[3];
}
export function isCatalogued(text) {
  return MAP.has(text);
}
export function createI18n(document, window) {
  let language = 'pt';
  const textSources = new WeakMap();
  const attrSources = new WeakMap();
  const attrs = ['aria-label', 'title', 'placeholder', 'alt', 'content'];
  const ignored = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG']);
  const syncText = (node) => {
    if (!node || typeof node.nodeValue !== 'string' || node.nodeValue.length > 750) return;
    let entry = textSources.get(node);
    if (!entry || node.nodeValue !== entry.rendered) {
      entry = { source: node.nodeValue, rendered: node.nodeValue };
      textSources.set(node, entry);
    }
    const target = translateText(entry.source, language);
    entry.rendered = target;
    if (node.nodeValue !== target) node.nodeValue = target;
  };
  const syncAttrs = (node) => {
    if (typeof node.getAttribute !== 'function') return;
    let saved = attrSources.get(node);
    if (!saved) {
      saved = new Map();
      attrSources.set(node, saved);
    }
    for (const name of attrs) {
      const value = node.getAttribute(name);
      if (value === null || value.length > 600) continue;
      let entry = saved.get(name);
      if (!entry || value !== entry.rendered) {
        entry = { source: value, rendered: value };
        saved.set(name, entry);
      }
      const next = translateText(entry.source, language);
      entry.rendered = next;
      if (value !== next) node.setAttribute(name, next);
    }
  };
  const walk = (node) => {
    if (!node) return;
    if (node.nodeType === 3) {
      syncText(node);
      return;
    }
    if (node.nodeType !== 1 || ignored.has(node.tagName)) return;
    syncAttrs(node);
    for (const child of node.childNodes ?? []) walk(child);
  };
  let observer;
  if (typeof window?.MutationObserver === 'function' && document?.body) {
    observer = new window.MutationObserver((records) => {
      for (const change of records) {
        if (change.type === 'characterData') syncText(change.target);
        else if (change.type === 'attributes') syncAttrs(change.target);
        else for (const node of change.addedNodes ?? []) walk(node);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: attrs,
    });
  }
  return {
    setLanguage(lang) {
      language = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';
      if (document.documentElement?.setAttribute)
        document.documentElement.setAttribute('lang', language === 'pt' ? 'pt-BR' : language);
      walk(document.body);
      if (document.head) walk(document.head);
      return language;
    },
    translate: (value) => translateText(value, language),
    destroy() {
      observer?.disconnect();
    },
  };
}
