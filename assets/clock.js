(function () {
  const H = document.getElementById('tp-hour');
  const M = document.getElementById('tp-minute');
  const S = document.getElementById('tp-second');
  if (!H || !M || !S) return;
  const rot = (el, deg) => el.setAttribute('transform', `rotate(${deg} 50 50)`);

  function draw(d) {
    const s = d.getSeconds();
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    rot(S, s * 6);      // секундная — шаг 1 сек
    rot(M, m * 6);      // минутная — плавно
    rot(H, h * 30);     // часовая — плавно
  }

  function tick() {
    const now = new Date();
    draw(now);
    // выравнивание по началу секунды
    setTimeout(tick, 1000 - now.getMilliseconds());
  }

  draw(new Date());
  tick();
})();
