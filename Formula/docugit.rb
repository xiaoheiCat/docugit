# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_09.02.06_e1dca2"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.02.06_e1dca2/docugit-darwin-arm64"
      sha256 "f78746bc3f5fb5c07472e4b9f0ab3e5306dc44b7cf4a16b4ad4536af90e714ce"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.02.06_e1dca2/docugit-darwin-amd64"
      sha256 "38afbd80a5ec1fd6c76bccbbf69202c96f69380f2a2f1e695fa97bc83298125e"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.02.06_e1dca2/docugit-linux-arm64"
      sha256 "bd665e4f5b734807c920936161cc6d6a062404dabb55516b03132e6cbf85588e"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.02.06_e1dca2/docugit-linux-amd64"
      sha256 "dab6c5b243490de86f0a8935b8e0e002eba848d608f18a275b21e0dbb8c4db9d"
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
