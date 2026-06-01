# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_04.01.04_4ca9b9"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.01.04_4ca9b9/docugit-darwin-arm64"
      sha256 "9995ae7565799563b7354ac09372a8ffde39da9e81463da93b818e16fa1a5fe3"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.01.04_4ca9b9/docugit-darwin-amd64"
      sha256 "3c1168d84b0e4652040f150a6c8117e2f38cd0f98d5819a7d0ce8e3a42208f16"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.01.04_4ca9b9/docugit-linux-arm64"
      sha256 "cef147390daacad7569b56d3bdccbadfc836425f250e3c82cc62bbb5d458f080"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.01.04_4ca9b9/docugit-linux-amd64"
      sha256 "16a3b46496981c0514763e2b0bf110956239839eaedefd0c1d51f61b32054d62"
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
