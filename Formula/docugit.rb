# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_08.34.49_e0e251"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.34.49_e0e251/docugit-darwin-arm64"
      sha256 "2c5eaf1e07f1a399adc8021debb71644ef060143a130e2581fe70438a5cf4050"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.34.49_e0e251/docugit-darwin-amd64"
      sha256 "e7b4c61ef0eac52c33079cd9a425250e273bf11515a4b3421c29209296f4fa16"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.34.49_e0e251/docugit-linux-arm64"
      sha256 "12c5b41c17015b44e3dd3636900f49886d739c8d4b219ddccbe6e3fb1e776a10"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.34.49_e0e251/docugit-linux-amd64"
      sha256 "401cf933bfa749bfa0df9b0d2cf1d0c2695197950f05b0b0a3fc39c10107d177"
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
