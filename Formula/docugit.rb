# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_06.20.53_699ec9"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.20.53_699ec9/docugit-darwin-arm64"
      sha256 "27c14d2d3816e54e8f09e9141f9f506124547e39eb38e1709b4c8576a2c407a7"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.20.53_699ec9/docugit-darwin-amd64"
      sha256 "568cd71bd2ab27d2877e924176b321886fbf85e72bfb7a2396b6be0900d83018"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.20.53_699ec9/docugit-linux-arm64"
      sha256 "13bf50377ec1c25244ba2c17b5c822d1a21a2f886993adf7523128d9eab45158"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_06.20.53_699ec9/docugit-linux-amd64"
      sha256 "7a8f4b24a2e5d8cadc59b993d65cd1b9f16951fd44fbf671142355986a13891c"
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
