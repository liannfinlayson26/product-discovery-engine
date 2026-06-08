import type { ApiIdentifyResponse } from "./types";

export const MOCK_RESPONSE: ApiIdentifyResponse = {
  identification: {
    productName: "Air Max 270",
    brand: "Nike",
    category: "Footwear",
    material: "Mesh upper, rubber outsole",
    style: "Athletic / Lifestyle",
    description:
      "The Nike Air Max 270 features Nike's biggest heel Air unit yet for a super-soft ride. Inspired by the Air Max 180 and Air Max 93, the shoe's design turns heritage into something new with an exaggerated tongue and heel pull tab.",
  },
  products: [
    {
      id: "1",
      name: "Nike Air Max 270 (Men's)",
      price: "$150.00",
      store: "Nike",
      buyUrl: "https://www.nike.com/t/air-max-270-mens-shoes",
      thumbnailUrl:
        "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/skwgyqrbfzhu6uyeh0gg/air-max-270-mens-shoes-KkLcGR.png",
    },
    {
      id: "2",
      name: "Nike Air Max 270 React",
      price: "$160.00",
      store: "Foot Locker",
      buyUrl: "https://www.footlocker.com/product/nike-air-max-270-react",
      thumbnailUrl:
        "https://images.footlocker.com/is/image/FLEU/314204715001_01?wid=500&hei=500&fmt=png-alpha",
    },
    {
      id: "3",
      name: "Nike Air Max 270 (Women's)",
      price: "$150.00",
      store: "Zappos",
      buyUrl: "https://www.zappos.com/p/nike-air-max-270/product/9207890",
      thumbnailUrl:
        "https://m.media-amazon.com/images/I/71Z4MH6eRpL._AC_UX575_.jpg",
    },
    {
      id: "4",
      name: "Nike Air Max 270 — Triple Black",
      price: "$178.00",
      store: "StockX",
      buyUrl: "https://stockx.com/nike-air-max-270-triple-black",
      thumbnailUrl:
        "https://images.stockx.com/images/Nike-Air-Max-270-Triple-Black-Product.jpg",
    },
  ],
};
