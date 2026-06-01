# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_05.35.57_2f5f0f"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.35.57_2f5f0f/docugit-darwin-arm64"
      sha256 "aa0264c007c6a4895113688445e7dbe9f78a99a1586f3f0312291057a5c3808b"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.35.57_2f5f0f/docugit-darwin-amd64"
      sha256 "cad5d16678fbe94d6055ca8b29ca5ed6e5ca2d473a37dad46914e6e27e246c2f"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.35.57_2f5f0f/docugit-linux-arm64"
      sha256 "e32b25971b444d2962de42bbbc5dc001abe2ec59acf877cd5e3396805973bd03"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.35.57_2f5f0f/docugit-linux-amd64"
      sha256 "330e167c8e6c3811bb237815ea07fb002b0b8eb885756889fe496762af0a1f01"
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
