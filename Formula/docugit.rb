# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_14.36.52_066fad"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.36.52_066fad/docugit-darwin-arm64"
      sha256 "7c926cf69716aa2cb69fa58470986ee008a82f3a9db2300a49af8f9726181fc2"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.36.52_066fad/docugit-darwin-amd64"
      sha256 "9910af30f0c18cfecfea8d1400f3472bf5c4e44d7f562d9905420f1a1e18f328"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.36.52_066fad/docugit-linux-arm64"
      sha256 "1810f99ec4bf0ee48547dad55366f9ad875865355c31dc84ef5b517e8235dbd3"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.36.52_066fad/docugit-linux-amd64"
      sha256 "63d4ef5203fbb664240082ea73a368e9c6de9346862d3df9518a55a1aa8aa5e1"
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
