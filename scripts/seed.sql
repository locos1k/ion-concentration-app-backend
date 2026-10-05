TRUNCATE likes, solutions, users RESTART IDENTITY CASCADE;

INSERT INTO users (username, password) VALUES
  ('student', 'demo');

INSERT INTO solutions
  (name, molar_concentration, ph, description, image, video, status, created_at, published_at, creator_id)
VALUES
  ('Соляная кислота', 0.1, 1,
   'Сильная одноосновная кислота. В разбавленных водных растворах диссоциирует практически полностью: HCl -> H+ + Cl-. Раствор бесцветный, сильно пахнет хлороводородом.',
   'HCl.PNG', 'hcl.MP4', 'published', now(), now(), 1),

  ('Гидроксид натрия', 0.05, 12.7,
   'Сильное однокислотное основание, в водном растворе диссоциирует нацело: NaOH -> Na+ + OH-. Растворение сопровождается сильным разогревом.',
   'NaOH.PNG', 'naoh.MP4', 'published', now(), now(), 1),

  ('Хлорид натрия', 0.2, 7,
   'Соль сильной кислоты и сильного основания, полностью диссоциирует: NaCl -> Na+ + Cl-. Среда раствора нейтральная, гидролиза нет.',
   'NaCl.PNG', 'nacl.mov', 'published', now(), now(), 1),

  ('Серная кислота', 0.01, 1.7,
   'Сильная двухосновная кислота, диссоциирует ступенчато: по первой ступени практически полностью, по второй — частично.',
   'H2SO4.PNG', 'h2so4.MP4', 'published', now(), now(), 1),

  ('Аммиак', NULL, NULL, NULL,
   'NH3.PNG', 'nh3.MP4', 'draft', now(), NULL, 1),

  ('Уксусная кислота', 0.1, 2.9,
   'Слабая одноосновная кислота, диссоциирует обратимо и незначительно: CH3COOH <-> CH3COO- + H+.',
   'CH3COOH.PNG', 'ch3cooh.MP4', 'deleted', now(), now(), 1);

INSERT INTO likes (user_id, solution_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4);
