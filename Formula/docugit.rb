# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_03.45.42_8135e1"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.45.42_8135e1/docugit-darwin-arm64"
      sha256 "063319c4341531c85d861dc4c79f8d42d44b5d899b040739f566b461a0a5a728"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.45.42_8135e1/docugit-darwin-amd64"
      sha256 "222713376a265356e2fc893f18cc488d23640de186a434e13203933f2f46cdf4"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.45.42_8135e1/docugit-linux-arm64"
      sha256 "f9cb8c2769db1a10dff9486e27272ca517ece6e62ee3a1e0d4f1e9aace09a494"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.45.42_8135e1/docugit-linux-amd64"
      sha256 "91702bb2fcd681730c9f42fe5c5dea93536e5e7a2254bed727c82be280af4712"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
