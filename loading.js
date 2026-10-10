(() => {
  const root = document.documentElement;
  const loader = document.querySelector('.site-loader');
  const bar = loader.querySelector('.loader-bar');
  const fill = bar.firstElementChild;
  const percent = document.getElementById('loader-percent');
  const label = document.getElementById('loader-label');
  const started = performance.now();
  let finished = false;
  let settled = 0;
  let timeout;

  const reveal = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    clearTimeout(window.loadingFallback);
    label.textContent = 'Welcome';
    root.classList.remove('site-loading');
    loader.setAttribute('aria-hidden', 'true');
    if (loader.contains(document.activeElement)) document.activeElement.blur();
  };

  loader.querySelector('button').addEventListener('click', reveal);
  timeout = setTimeout(reveal, 10000);

  // Track each image URL once, even when shared by a thumbnail and gallery.
  const sources = [...new Set([...document.images].map(img => img.currentSrc || img.src))];
  const videos = [...document.querySelectorAll('video')];
  const total = sources.length + videos.length;
  const update = () => {
    if (finished) return;
    settled += 1;
    const progress = Math.round(settled / total * 100);
    percent.textContent = `${progress}%`;
    bar.setAttribute('aria-valuenow', String(progress));
    fill.style.transform = `scaleX(${progress / 100})`;
  };
  const imagesReady = sources.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = src;
    if (img.complete) resolve();
  }).then(update));
  const videosReady = videos.map(video => new Promise(resolve => {
    if (video.readyState >= 2 || video.error) return resolve();
    const done = () => {
      video.removeEventListener('loadeddata', done);
      video.removeEventListener('error', done);
      resolve();
    };
    video.addEventListener('loadeddata', done);
    video.addEventListener('error', done);
  }).then(update));

  Promise.all([...imagesReady, ...videosReady]).then(() => {
    if (finished) return;
    // Give cached loads a short, readable completion beat before the reveal.
    setTimeout(reveal, Math.max(250, 700 - (performance.now() - started)));
  });
})();
