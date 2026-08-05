import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get("pincode");
  const country = req.nextUrl.searchParams.get("country") || "India";

  // International: skip India Post, just return country as state
  if (country !== "India") {
    if (!pincode || pincode.length < 3) {
      return NextResponse.json({ city: "", state: "", district: "", error: "Invalid postal code" }, { status: 400 });
    }
    return NextResponse.json({
      city: pincode,
      state: country,
      district: "",
    });
  }

  if (!pincode || pincode.length !== 6) {
    return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("postalpincode.in returned non-OK status:", res.status);
      return NextResponse.json({ city: "", state: "", district: "", error: `upstream ${res.status}` });
    }

    const data = await res.json();
    console.log("postalpincode.in raw response:", JSON.stringify(data));

    if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return NextResponse.json({
        city: po.District || po.Name || "",
        state: po.State || "",
        district: po.District || "",
      });
    }

    console.warn("postalpincode.in lookup not successful:", data[0]?.Status, data[0]?.Message);
    return NextResponse.json({ city: "", state: "", district: "", upstreamStatus: data[0]?.Status });
  } catch (err) {
    console.error("Pincode lookup fetch failed:", err);
    return NextResponse.json({ city: "", state: "", district: "", error: String(err) }, { status: 500 });
  }
}
