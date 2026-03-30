import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/birthday-profile/${slug}/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const profile = await res.json();
    const name = profile.user
      ? `${profile.user.first_name ?? ""} ${profile.user.last_name ?? ""}`.trim()
      : slug;
    const title = `${name}'s Birthday Profile`;
    const description = profile.bio
      ? profile.bio.slice(0, 160)
      : `Send ${name} a gift, leave a message, or contribute to their wishlist on Celnoia.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://celnoia.com/birthday/${slug}`,
        type: "profile",
        images: profile.profile_image
          ? [{ url: profile.profile_image, alt: name }]
          : [{ url: "/celnoia-logo.png", alt: "Celnoia" }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: profile.profile_image ? [profile.profile_image] : ["/celnoia-logo.png"],
      },
    };
  } catch {
    return {
      title: "Birthday Profile",
      description: "Send a gift, leave a message, or contribute to a wishlist on Celnoia.",
    };
  }
}
