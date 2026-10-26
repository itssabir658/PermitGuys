/*
 * The PermitGuys wordmark as vector outlines: "permit" and "guys" set in TeX
 * Gyre Adventor Bold (GUST Font License), a free revival of the Avant Garde
 * Gothic the supplied logo is set in. At the logo's height it matches the
 * supplied PNG (public/brand) to the pixel, in width and in weight.
 *
 * In the font's units (1000 to the em), baseline at y 0: the ink runs from
 * x 54 to 5360, and from the dot of the i (767 above the baseline) to the
 * foot of the g (221 below).
 */
export const WORDMARK = {
  viewBox: "54 -767 5306 988",
  /** Ink width and height in em, and how far the ink drops below the baseline. */
  width: 5.306,
  height: 0.988,
  descent: 0.221,
  permit: "M54 185H187V-52C237 -7 289 13 357 13C517 13 634 -111 634 -279C634 -446 518 -567 358 -567C283 -567 219 -539 176 -489V-554H54ZM179 -278C179 -373 249 -445 341 -445C431 -445 500 -372 500 -276C500 -182 431 -109 343 -109C249 -109 179 -181 179 -278ZM690 -275C690 -113 821 13 990 13C1102 13 1217 -50 1254 -164H1109C1075 -124 1042 -109 987 -109C908 -109 850 -151 834 -218H1263C1267 -237 1268 -249 1268 -269C1268 -441 1147 -567 982 -567C819 -567 690 -438 690 -275ZM830 -335C851 -406 905 -445 984 -445C1066 -445 1120 -406 1137 -335ZM1354 0H1487V-308C1487 -394 1526 -437 1606 -439V-567H1596C1539 -567 1511 -551 1476 -500V-554H1354ZM1674 0H1807V-273C1807 -404 1838 -445 1915 -445C1985 -445 2023 -413 2023 -304V0H2156V-273C2156 -405 2194 -445 2268 -445C2330 -445 2372 -415 2372 -304V0H2505V-320C2505 -486 2427 -567 2281 -567C2203 -567 2148 -541 2103 -481C2065 -541 2016 -567 1940 -567C1875 -567 1835 -549 1796 -502V-554H1674ZM2614 0H2747V-554H2614ZM2615 -634H2748V-767H2615ZM2809 -433H2874V0H3007V-433H3087V-554H3007V-739H2874V-554H2809Z",
  guys: "M3130 -281C3130 -110 3244 13 3402 13C3480 13 3532 -12 3584 -73C3579 46 3528 104 3429 104C3367 104 3329 88 3290 45H3139C3184 156 3288 221 3424 221C3596 221 3711 133 3711 -105V-554H3584V-484C3543 -540 3483 -567 3403 -567C3246 -567 3130 -445 3130 -281ZM3264 -275C3264 -377 3325 -445 3418 -445C3513 -445 3578 -376 3578 -275C3578 -175 3515 -109 3420 -109C3325 -109 3264 -174 3264 -275ZM3814 -257C3814 -62 3896 13 4025 13C4092 13 4134 -4 4184 -53V0H4307V-554H4174V-293C4174 -219 4168 -185 4153 -160C4133 -128 4097 -109 4052 -109C3988 -109 3947 -136 3947 -283V-554H3814ZM4366 -554 4569 -52 4465 185H4608L4928 -554H4775L4641 -195L4518 -554ZM4959 -176C4973 -47 5052 13 5162 13C5273 13 5360 -70 5360 -176C5360 -258 5322 -302 5206 -338C5115 -367 5112 -369 5112 -398C5112 -425 5134 -445 5163 -445C5191 -445 5209 -430 5215 -401H5345C5340 -505 5257 -567 5163 -567C5060 -567 4979 -493 4979 -398C4979 -317 5023 -271 5133 -234C5222 -204 5227 -195 5227 -163C5227 -132 5201 -109 5167 -109C5128 -109 5106 -129 5093 -176Z",
  /** The supplied logo's colours. */
  red: "#ee352f",
  charcoal: "#231f20",
} as const;

/** The name as it appears in text. */
export const WORDMARK_NAME = "PermitGuys";

/**
 * The wordmark as markup, for text that is written as HTML or split into
 * lines (Wordmark.tsx draws the same thing in React): the outlines, hidden
 * from assistive technology, and the name as text for screen readers,
 * search and copying.
 */
export const WORDMARK_HTML = `<span class="wordmark"><svg viewBox="${WORDMARK.viewBox}" class="wordmark__svg" aria-hidden="true" focusable="false"><path class="wordmark__permit" d="${WORDMARK.permit}"></path><path class="wordmark__guys" d="${WORDMARK.guys}"></path></svg><span class="sr-only">${WORDMARK_NAME}</span></span>`;

/** Escaped HTML with every mention of the name shown as the wordmark. */
export const wordmarkInHtml = (html: string) => html.split(WORDMARK_NAME).join(WORDMARK_HTML);
